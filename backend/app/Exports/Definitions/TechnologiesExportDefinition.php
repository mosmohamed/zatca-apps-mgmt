<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\Technology;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class TechnologiesExportDefinition implements ExportDefinitionInterface
{
    public function key(): string
    {
        return 'technologies';
    }

    public function permission(): string
    {
        return 'technologies.export';
    }

    public function filenamePrefix(): string
    {
        return 'Technologies';
    }

    public function reportTitle(): string
    {
        return 'Technologies Report';
    }

    public function sheetName(): string
    {
        return 'Technologies';
    }

    /**
     * @return list<string>
     */
    public function searchColumns(): array
    {
        return ['name', 'category', 'description'];
    }

    /**
     * @return list<string>
     */
    public function sortableColumns(): array
    {
        return ['name', 'category', 'is_active', 'created_at'];
    }

    public function defaultSort(): string
    {
        return 'name';
    }

    /**
     * @return list<ExportColumn>
     */
    public function columns(): array
    {
        return [
            ExportColumn::make('id', 'ID', static fn (Model $m): int => (int) $m->getKey(), 8, 'center'),
            ExportColumn::make('name', 'Name', static fn (Technology $m): string => (string) $m->name, 24),
            ExportColumn::make(
                'category',
                'Category',
                static fn (Technology $m): string => $m->category instanceof \BackedEnum
                    ? (string) $m->category->value
                    : (string) $m->category,
                16,
            ),
            ExportColumn::make(
                'description',
                'Description',
                static fn (Technology $m): string => (string) ($m->description ?? '-'),
                34,
            ),
            ExportColumn::make(
                'applications_count',
                'Applications',
                static fn (Technology $m): int => (int) ($m->applications_count ?? $m->applications()->count()),
                14,
                'center',
            ),
            ExportColumn::make(
                'is_active',
                'Active',
                static fn (Technology $m): string => $m->is_active ? 'Yes' : 'No',
                10,
                'center',
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (Technology $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
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
        $query = Technology::query()->withCount('applications');

        return $query;
    }
}
