<?php

declare(strict_types=1);

namespace App\Services;

use App\Exports\ServiceDeskEscalationMatrixExport;
use App\Models\ServiceDeskCategory;
use App\Models\User;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ServiceDeskEscalationMatrixExportService
{
    public function __construct(
        private readonly ServiceDeskTeamAssignmentService $infraTeamAssignmentService,
    ) {}

    public function downloadAll(User $user): BinaryFileResponse
    {
        $cards = $this->infraTeamAssignmentService->detailsCards();

        return $this->download(
            $cards,
            'service_desk_escalation_matrix',
            'Escalation Matrix',
            $user,
            'all',
        );
    }

    public function downloadCategory(ServiceDeskCategory $category, User $user): BinaryFileResponse
    {
        $cards = $this->infraTeamAssignmentService->detailsCards();

        $targetIds = $this->resolveExportableCategoryIds($category);
        $filtered = array_values(array_filter(
            $cards,
            static fn (array $card): bool => in_array((int) $card['id'], $targetIds, true),
        ));

        $slug = Str::slug((string) $category->code);

        return $this->download(
            $filtered,
            'service_desk_escalation_'.$slug,
            (string) ($filtered[0]['title_en'] ?? $category->name_en),
            $user,
            'category:'.$category->id,
        );
    }

    /**
     * @param  list<array<string, mixed>>  $cards
     */
    private function download(
        array $cards,
        string $filenamePrefix,
        string $sheetTitle,
        User $user,
        string $scope,
    ): BinaryFileResponse {
        [$rows, $merges, $levelHeaders] = $this->buildMatrix($cards);

        activity()
            ->causedBy($user)
            ->withProperties([
                'entity' => 'service-desk-escalation-matrix',
                'scope' => $scope,
                'streams' => count($cards),
            ])
            ->log('Exported infrastructure escalation matrix');

        $filename = sprintf('%s_%s.xlsx', $filenamePrefix, now()->format('Y-m-d'));

        return Excel::download(
            new ServiceDeskEscalationMatrixExport($rows, $merges, $levelHeaders, $sheetTitle),
            $filename,
        );
    }

    /**
     * Parent categories export themselves plus every leaf subcategory; leaves export alone.
     *
     * @return list<int>
     */
    private function resolveExportableCategoryIds(ServiceDeskCategory $category): array
    {
        $category->loadMissing(['children' => static function ($query): void {
            $query->where('is_active', true)->orderBy('sort_order')->orderBy('name_en');
        }]);

        if ($category->children->isNotEmpty()) {
            return $category->children->modelKeys();
        }

        return [(int) $category->id];
    }

    /**
     * @param  list<array<string, mixed>>  $cards
     * @return array{0: list<array<int, string>>, 1: list<array{start: int, end: int}>, 2: list<string>}
     */
    private function buildMatrix(array $cards): array
    {
        $levelMeta = [];
        foreach ($cards as $card) {
            foreach ($card['levels'] ?? [] as $level) {
                $code = (string) ($level['code'] ?? '');
                if ($code === '' || isset($levelMeta[$code])) {
                    continue;
                }
                $levelMeta[$code] = [
                    'code' => $code,
                    'name_en' => (string) ($level['name_en'] ?? $code),
                    'note_en' => (string) ($level['note_en'] ?? ''),
                    'sort_order' => (int) ($level['sort_order'] ?? 0),
                ];
            }
        }

        uasort(
            $levelMeta,
            static fn (array $left, array $right): int => $left['sort_order'] <=> $right['sort_order'],
        );

        $orderedLevels = array_values($levelMeta);
        $l0Index = null;
        foreach ($orderedLevels as $index => $level) {
            if ($level['code'] === 'L0') {
                $l0Index = $index;
                break;
            }
        }
        if ($l0Index === null && $orderedLevels !== []) {
            $l0Index = 0;
        }

        $l0 = $l0Index !== null ? $orderedLevels[$l0Index] : null;
        $higherLevels = [];
        foreach ($orderedLevels as $index => $level) {
            if ($index === $l0Index) {
                continue;
            }
            $higherLevels[] = $level;
        }

        $levelHeaders = array_map(
            static function (array $level): string {
                $label = $level['name_en'];
                if ($level['note_en'] !== '') {
                    $label .= ' ('.$level['note_en'].')';
                }

                return $label;
            },
            $higherLevels,
        );

        $headerRow1 = [
            'Escalation Stream',
            $l0 !== null
                ? $l0['name_en'].($l0['note_en'] !== '' ? ' ('.$l0['note_en'].')' : '')
                : 'Level 0',
            '',
            '',
            ...$levelHeaders,
        ];
        $headerRow2 = ['', 'Name', 'Email ID', 'Contact Number', ...array_fill(0, count($levelHeaders), '')];

        $rows = [$headerRow1, $headerRow2];
        $merges = [];
        $dataRow = 3;

        foreach ($cards as $card) {
            $levelsByCode = [];
            foreach ($card['levels'] ?? [] as $level) {
                $levelsByCode[(string) $level['code']] = $level;
            }

            $l0Members = $l0 !== null
                ? array_values($levelsByCode[$l0['code']]['members'] ?? [])
                : [];
            $rowCount = max(count($l0Members), 1);
            $startRow = $dataRow;
            $endRow = $dataRow + $rowCount - 1;

            $higherCells = [];
            foreach ($higherLevels as $level) {
                $higherCells[] = $this->formatStackedMembers(
                    array_values($levelsByCode[$level['code']]['members'] ?? []),
                );
            }

            for ($index = 0; $index < $rowCount; $index++) {
                $member = $l0Members[$index] ?? null;
                $rows[] = [
                    $index === 0 ? (string) ($card['title_en'] ?? $card['name_en'] ?? '') : '',
                    $member !== null ? (string) ($member['full_name'] ?? '') : '',
                    $member !== null ? (string) ($member['email'] ?? '') : '',
                    $member !== null ? (string) ($member['phone'] ?? '') : '',
                    ...($index === 0 ? $higherCells : array_fill(0, count($higherCells), '')),
                ];
                $dataRow++;
            }

            if ($endRow > $startRow) {
                $merges[] = ['start' => $startRow, 'end' => $endRow];
            }
        }

        return [$rows, $merges, $levelHeaders];
    }

    /**
     * @param  list<array<string, mixed>>  $members
     */
    private function formatStackedMembers(array $members): string
    {
        if ($members === []) {
            return '';
        }

        $blocks = [];
        foreach ($members as $member) {
            $lines = array_values(array_filter([
                trim((string) ($member['full_name'] ?? '')),
                trim((string) ($member['email'] ?? '')),
                trim((string) ($member['phone'] ?? '')),
                ! empty($member['job_title']) ? 'Role: '.trim((string) $member['job_title']) : null,
            ], static fn (?string $line): bool => $line !== null && $line !== ''));

            if ($lines !== []) {
                $blocks[] = implode("\n", $lines);
            }
        }

        return implode("\n\n", $blocks);
    }
}
