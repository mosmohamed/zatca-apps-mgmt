<?php

declare(strict_types=1);

namespace App\Services;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\ProfessionalExcelExport;
use App\Exports\Support\ExportColumn;
use App\Models\User;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Generator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    use SearchTrait;
    use SortTrait;

    private const int CHUNK_SIZE = 500;

    private const int MAX_EXPORT_ROWS = 10_000;

    private const int MAX_SELECTED_IDS = 5_000;

    public function __construct(
        private readonly SettingsService $settingsService,
    ) {
    }

    /**
     * @param  array{format: string, scope: string, ids: list<int>, search: string|null, sort: string|null, page: int|null, per_page: int|null, columns: list<string>|null, filters_summary: string|null}  $payload
     */
    public function export(ExportDefinitionInterface $definition, array $payload, User $user): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $columns = $this->visibleColumns($definition, $payload['columns'] ?? null);
        $rows = $this->resolveRows($definition, $payload);
        $filtersSummary = $this->buildFiltersSummary($payload);
        $filename = $this->buildFilename($definition, $payload['format']);

        $this->logExport($definition, $user, $payload, $filtersSummary);

        if ($payload['format'] === 'json') {
            return $this->downloadJson($rows, $columns, $filename);
        }

        $meta = [
            'company_name' => (string) $this->settingsService->get('company_name', config('app.name')),
            'report_title' => $definition->reportTitle(),
            'exported_at' => now()->format('Y-m-d H:i'),
            'filters_summary' => $filtersSummary,
        ];

        return Excel::download(
            new ProfessionalExcelExport($definition, $rows, $columns, $meta),
            $filename,
        );
    }

    /**
     * @param  list<string>|null  $requestedKeys
     * @return list<ExportColumn>
     */
    private function visibleColumns(ExportDefinitionInterface $definition, ?array $requestedKeys): array
    {
        $columns = $definition->columns();

        if ($requestedKeys === null || $requestedKeys === []) {
            return $columns;
        }

        $allowed = array_flip($requestedKeys);

        $filtered = array_values(array_filter(
            $columns,
            static fn (ExportColumn $column): bool => array_key_exists($column->key, $allowed),
        ));

        return $filtered === [] ? $columns : $filtered;
    }

    /**
     * @param  array{format: string, scope: string, ids: list<int>, search: string|null, sort: string|null, page: int|null, per_page: int|null, columns: list<string>|null, filters_summary: string|null}  $payload
     * @return iterable<int, Model>
     */
    private function resolveRows(ExportDefinitionInterface $definition, array $payload): iterable
    {
        return match ($payload['scope']) {
            'selected' => $this->rowsForSelected($definition, $payload['ids']),
            'current_page' => $this->rowsForCurrentPage($definition, $payload),
            'filtered' => $this->rowsForFiltered($definition, $payload),
            default => $this->rowsForAll($definition),
        };
    }

    /**
     * @param  list<int>  $ids
     * @return list<Model>
     */
    private function rowsForSelected(ExportDefinitionInterface $definition, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        $ids = array_slice(array_values(array_unique(array_map('intval', $ids))), 0, self::MAX_SELECTED_IDS);

        $query = $definition->query();

        return $query->whereIn($query->getModel()->getQualifiedKeyName(), $ids)->get()->all();
    }

    /**
     * @param  array{search: string|null, sort: string|null, page: int|null, per_page: int|null}  $payload
     * @return list<Model>
     */
    private function rowsForCurrentPage(ExportDefinitionInterface $definition, array $payload): array
    {
        $query = $definition->query();

        $this->applyColumnSearch($query, $payload['search'] ?? null, $definition->searchColumns());
        $this->applyColumnSort($query, $payload['sort'] ?? null, $definition->sortableColumns(), $definition->defaultSort());

        $perPage = max(1, min((int) ($payload['per_page'] ?? 15), 100));
        $page = max(1, (int) ($payload['page'] ?? 1));

        return $query->paginate(perPage: $perPage, page: $page)->items();
    }

    /**
     * @param  array{search: string|null, sort: string|null}  $payload
     * @return Generator<int, Model>
     */
    private function rowsForFiltered(ExportDefinitionInterface $definition, array $payload): Generator
    {
        $query = $definition->query();

        $this->applyColumnSearch($query, $payload['search'] ?? null, $definition->searchColumns());
        $this->applyColumnSort($query, $payload['sort'] ?? null, $definition->sortableColumns(), $definition->defaultSort());

        $yielded = 0;

        foreach ($query->cursor() as $model) {
            yield $model;
            $yielded++;

            if ($yielded >= self::MAX_EXPORT_ROWS) {
                break;
            }
        }
    }

    /**
     * Entire dataset, ignoring search filters but honouring soft-delete defaults.
     * Iterated in fixed-size batches ordered by primary key (chunkById-style)
     * to keep memory usage bounded regardless of table size.
     *
     * @return Generator<int, Model>
     */
    private function rowsForAll(ExportDefinitionInterface $definition): Generator
    {
        $keyName = $definition->query()->getModel()->getQualifiedKeyName();

        $lastId = 0;
        $yielded = 0;

        do {
            /** @var Builder<Model> $chunkQuery */
            $chunkQuery = $definition->query()
                ->where($keyName, '>', $lastId)
                ->orderBy($keyName)
                ->limit(self::CHUNK_SIZE);

            $chunk = $chunkQuery->get();

            foreach ($chunk as $chunkModel) {
                yield $chunkModel;
                $lastId = $chunkModel->getKey();
                $yielded++;

                if ($yielded >= self::MAX_EXPORT_ROWS) {
                    return;
                }
            }
        } while ($chunk->count() === self::CHUNK_SIZE);
    }

    /**
     * @param  iterable<int, Model>  $rows
     * @param  list<ExportColumn>  $columns
     */
    private function downloadJson(iterable $rows, array $columns, string $filename): StreamedResponse
    {
        return ResponseFacade::streamDownload(static function () use ($rows, $columns): void {
            echo '[';

            $first = true;

            foreach ($rows as $row) {
                if (! $first) {
                    echo ',';
                }

                $first = false;

                $mapped = [];

                foreach ($columns as $column) {
                    $mapped[$column->header] = $column->resolve($row);
                }

                echo json_encode($mapped, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            echo ']';
        }, $filename, [
            'Content-Type' => 'application/json',
        ]);
    }

    private function buildFilename(ExportDefinitionInterface $definition, string $format): string
    {
        return sprintf('%s_%s.%s', $definition->filenamePrefix(), now()->format('Y-m-d'), $format);
    }

    /**
     * @param  array{scope: string, search: string|null, sort: string|null, filters_summary: string|null}  $payload
     */
    private function buildFiltersSummary(array $payload): string
    {
        if (is_string($payload['filters_summary'] ?? null) && trim((string) $payload['filters_summary']) !== '') {
            return trim((string) $payload['filters_summary']);
        }

        $parts = [
            'Scope: '.str_replace('_', ' ', $payload['scope']),
        ];

        if (is_string($payload['search'] ?? null) && trim((string) $payload['search']) !== '') {
            $parts[] = 'Search: "'.trim((string) $payload['search']).'"';
        }

        if (is_string($payload['sort'] ?? null) && trim((string) $payload['sort']) !== '') {
            $parts[] = 'Sort: '.trim((string) $payload['sort']);
        }

        return implode(' | ', $parts);
    }

    /**
     * @param  array{format: string, scope: string, ids: list<int>, search: string|null, sort: string|null}  $payload
     */
    private function logExport(ExportDefinitionInterface $definition, User $user, array $payload, string $filtersSummary): void
    {
        activity()
            ->causedBy($user)
            ->withProperties([
                'entity' => $definition->key(),
                'format' => $payload['format'],
                'scope' => $payload['scope'],
                'ids_count' => count($payload['ids'] ?? []),
                'filters_summary' => $filtersSummary,
            ])
            ->log(sprintf('Exported %s (%s, %s)', $definition->reportTitle(), $payload['scope'], $payload['format']));
    }
}
