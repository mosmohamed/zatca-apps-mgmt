<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\Department;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class DepartmentsExportDefinition implements ExportDefinitionInterface
{
    public function key(): string
    {
        return 'departments';
    }

    public function permission(): string
    {
        return 'departments.export';
    }

    public function filenamePrefix(): string
    {
        return 'Departments';
    }

    public function reportTitle(): string
    {
        return 'Departments Report';
    }

    public function sheetName(): string
    {
        return 'Departments';
    }

    /**
     * @return list<string>
     */
    public function searchColumns(): array
    {
        return ['name_ar', 'name_en'];
    }

    /**
     * @return list<string>
     */
    public function sortableColumns(): array
    {
        return ['name_ar', 'name_en', 'created_at', 'updated_at'];
    }

    public function defaultSort(): string
    {
        return 'name_en';
    }

    /**
     * @return list<ExportColumn>
     */
    public function columns(): array
    {
        return [
            ExportColumn::make('id', 'ID', static fn (Model $m): int => (int) $m->getKey(), 8, 'center'),
            ExportColumn::make('name_en', 'Name (EN)', static fn (Department $m): string => (string) $m->name_en, 28),
            ExportColumn::make('name_ar', 'Name (AR)', static fn (Department $m): string => (string) $m->name_ar, 28),
            ExportColumn::make(
                'applications_count',
                'Applications',
                static fn (Department $m): int => (int) ($m->applications_count ?? $m->applications()->count()),
                14,
                'center',
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (Department $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
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
        $query = Department::query()->withCount('applications');

        return $query;
    }
}
