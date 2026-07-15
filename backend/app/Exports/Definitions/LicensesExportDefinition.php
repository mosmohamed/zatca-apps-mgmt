<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\License;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class LicensesExportDefinition implements ExportDefinitionInterface
{
    public function key(): string
    {
        return 'licenses';
    }

    public function permission(): string
    {
        return 'licenses.export';
    }

    public function filenamePrefix(): string
    {
        return 'Licenses';
    }

    public function reportTitle(): string
    {
        return 'Licenses Report';
    }

    public function sheetName(): string
    {
        return 'Licenses';
    }

    /**
     * @return list<string>
     */
    public function searchColumns(): array
    {
        return ['publisher', 'name', 'product', 'version', 'description', 'environment', 'proof_of_entitlement'];
    }

    /**
     * @return list<string>
     */
    public function sortableColumns(): array
    {
        return [
            'publisher',
            'name',
            'product',
            'version',
            'environment',
            'licensed',
            'used',
            'available',
            'start_date',
            'end_date',
            'created_at',
        ];
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
            ExportColumn::make('publisher', 'Publisher', static fn (License $m): string => (string) $m->publisher, 22),
            ExportColumn::make('name', 'Name', static fn (License $m): string => (string) $m->name, 24),
            ExportColumn::make('product', 'Product', static fn (License $m): string => (string) $m->product, 22),
            ExportColumn::make(
                'version',
                'Version',
                static fn (License $m): string => (string) ($m->version ?? '-'),
                12,
            ),
            ExportColumn::make(
                'description',
                'Description',
                static fn (License $m): string => (string) ($m->description ?? '-'),
                34,
            ),
            ExportColumn::make(
                'environment',
                'Environment',
                static fn (License $m): string => $m->environment instanceof \BackedEnum
                    ? (string) $m->environment->value
                    : (string) $m->environment,
                14,
            ),
            ExportColumn::make('licensed', 'Licensed', static fn (License $m): int => (int) $m->licensed, 12, 'center'),
            ExportColumn::make('used', 'Used', static fn (License $m): int => (int) $m->used, 10, 'center'),
            ExportColumn::make('available', 'Available', static fn (License $m): int => (int) $m->available, 12, 'center'),
            ExportColumn::make(
                'proof_of_entitlement',
                'Proof of Entitlement',
                static fn (License $m): string => (string) ($m->proof_of_entitlement ?? '-'),
                30,
            ),
            ExportColumn::make(
                'start_date',
                'Start Date',
                static fn (License $m): string => $m->start_date?->format('Y-m-d') ?? '-',
                14,
                'center',
            ),
            ExportColumn::make(
                'end_date',
                'End Date',
                static fn (License $m): string => $m->end_date?->format('Y-m-d') ?? '-',
                14,
                'center',
            ),
            ExportColumn::make(
                'status',
                'Status',
                static fn (License $m): string => $m->status(),
                14,
                'center',
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (License $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
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
        $query = License::query();

        return $query;
    }
}
