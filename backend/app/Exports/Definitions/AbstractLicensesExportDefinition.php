<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\Contracts\LicenseRecord;
use BackedEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Shared export shape for the three independent license catalogues
 * (Apps, Infrastructure and Service Desk).
 */
abstract class AbstractLicensesExportDefinition implements ExportDefinitionInterface
{
    /**
     * @return class-string<Model&LicenseRecord>
     */
    abstract protected function modelClass(): string;

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
            ExportColumn::make('publisher', 'Publisher', static fn (Model $m): string => (string) $m->publisher, 22),
            ExportColumn::make('name', 'Name', static fn (Model $m): string => (string) $m->name, 24),
            ExportColumn::make('product', 'Product', static fn (Model $m): string => (string) $m->product, 22),
            ExportColumn::make(
                'version',
                'Version',
                static fn (Model $m): string => (string) ($m->version ?? '-'),
                12,
            ),
            ExportColumn::make(
                'description',
                'Description',
                static fn (Model $m): string => (string) ($m->description ?? '-'),
                34,
            ),
            ExportColumn::make(
                'environment',
                'Environment',
                static fn (Model $m): string => $m->environment instanceof BackedEnum
                    ? (string) $m->environment->value
                    : (string) $m->environment,
                14,
            ),
            ExportColumn::make('licensed', 'Licensed', static fn (Model $m): int => (int) $m->licensed, 12, 'center'),
            ExportColumn::make('used', 'Used', static fn (Model $m): int => (int) $m->used, 10, 'center'),
            ExportColumn::make('available', 'Available', static fn (Model $m): int => (int) $m->available, 12, 'center'),
            ExportColumn::make(
                'proof_of_entitlement',
                'Proof of Entitlement',
                static fn (Model $m): string => (string) ($m->proof_of_entitlement ?? '-'),
                30,
            ),
            ExportColumn::make(
                'start_date',
                'Start Date',
                static fn (Model $m): string => $m->start_date?->format('Y-m-d') ?? '-',
                14,
                'center',
            ),
            ExportColumn::make(
                'end_date',
                'End Date',
                static fn (Model $m): string => $m->end_date?->format('Y-m-d') ?? '-',
                14,
                'center',
            ),
            ExportColumn::make(
                'status',
                'Status',
                static fn (LicenseRecord $m): string => $m->status(),
                14,
                'center',
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (Model $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
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
        $model = $this->modelClass();

        /** @var Builder<Model> $query */
        $query = $model::query();

        return $query;
    }
}
