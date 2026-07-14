<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\Application;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class ApplicationsExportDefinition implements ExportDefinitionInterface
{
    public function key(): string
    {
        return 'applications';
    }

    public function permission(): string
    {
        return 'applications.export';
    }

    public function filenamePrefix(): string
    {
        return 'Applications';
    }

    public function reportTitle(): string
    {
        return 'Applications Report';
    }

    public function sheetName(): string
    {
        return 'Applications';
    }

    /**
     * @return list<string>
     */
    public function searchColumns(): array
    {
        return ['name_ar', 'name_en', 'code', 'business_owner', 'technical_owner'];
    }

    /**
     * @return list<string>
     */
    public function sortableColumns(): array
    {
        return ['name_ar', 'name_en', 'code', 'created_at', 'updated_at'];
    }

    public function defaultSort(): string
    {
        return '-created_at';
    }

    /**
     * @return list<ExportColumn>
     */
    public function columns(): array
    {
        return [
            ExportColumn::make('id', 'ID', static fn (Model $m): int => (int) $m->getKey(), 8, 'center'),
            ExportColumn::make('code', 'Code', static fn (Application $m): string => (string) $m->code, 16),
            ExportColumn::make('name_en', 'Name (EN)', static fn (Application $m): string => (string) $m->name_en, 28),
            ExportColumn::make('name_ar', 'Name (AR)', static fn (Application $m): string => (string) $m->name_ar, 28),
            ExportColumn::make(
                'department',
                'Department',
                static fn (Application $m): string => (string) ($m->department?->name_en ?? '-'),
                22,
            ),
            ExportColumn::make(
                'application_type',
                'Application Type',
                static fn (Application $m): string => (string) ($m->applicationType?->name_en ?? '-'),
                20,
            ),
            ExportColumn::make(
                'status',
                'Status',
                static fn (Application $m): string => (string) ($m->status?->name_en ?? '-'),
                14,
                'center',
            ),
            ExportColumn::make(
                'criticality',
                'Criticality',
                static fn (Application $m): string => (string) ($m->criticality?->name_en ?? '-'),
                14,
                'center',
            ),
            ExportColumn::make(
                'support_type',
                'Support Type',
                static fn (Application $m): string => (string) ($m->supportType?->name_en ?? '-'),
                18,
            ),
            ExportColumn::make(
                'business_owner',
                'Business Owner',
                static fn (Application $m): string => (string) ($m->business_owner ?? '-'),
                20,
            ),
            ExportColumn::make(
                'technical_owner',
                'Technical Owner',
                static fn (Application $m): string => (string) ($m->technical_owner ?? '-'),
                20,
            ),
            ExportColumn::make(
                'technologies',
                'Technologies',
                static fn (Application $m): string => $m->technologies->pluck('name')->implode(', ') ?: '-',
                30,
            ),
            ExportColumn::make(
                'documentation_url',
                'Documentation URL',
                static fn (Application $m): string => (string) ($m->documentation_url ?? '-'),
                24,
            ),
            ExportColumn::make(
                'repository_url',
                'Repository URL',
                static fn (Application $m): string => (string) ($m->repository_url ?? '-'),
                24,
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (Application $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
                18,
                'center',
            ),
            ExportColumn::make(
                'updated_at',
                'Updated At',
                static fn (Application $m): string => $m->updated_at?->format('Y-m-d H:i') ?? '-',
                18,
                'center',
            ),
        ];
    }

    /**
     * @return Builder<Model>
     */
    public function query(): Builder
    {
        /** @var Builder<Model> $query */
        $query = Application::query()->with([
            'department',
            'applicationType',
            'status',
            'criticality',
            'supportType',
            'technologies',
        ]);

        return $query;
    }
}
