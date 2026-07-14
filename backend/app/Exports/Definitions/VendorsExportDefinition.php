<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class VendorsExportDefinition implements ExportDefinitionInterface
{
    public function key(): string
    {
        return 'vendors';
    }

    public function permission(): string
    {
        return 'vendors.export';
    }

    public function filenamePrefix(): string
    {
        return 'Vendors';
    }

    public function reportTitle(): string
    {
        return 'Vendors Report';
    }

    public function sheetName(): string
    {
        return 'Vendors';
    }

    /**
     * @return list<string>
     */
    public function searchColumns(): array
    {
        return ['name', 'email', 'phone', 'contact_person_email'];
    }

    /**
     * @return list<string>
     */
    public function sortableColumns(): array
    {
        return ['name', 'email', 'status', 'created_at', 'updated_at'];
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
            ExportColumn::make('name', 'Name', static fn (Vendor $m): string => (string) $m->name, 26),
            ExportColumn::make('email', 'Email', static fn (Vendor $m): string => (string) ($m->email ?? '-'), 26),
            ExportColumn::make('phone', 'Phone', static fn (Vendor $m): string => (string) ($m->phone ?? '-'), 18),
            ExportColumn::make(
                'contact_person_email',
                'Contact Email',
                static fn (Vendor $m): string => (string) ($m->contact_person_email ?? '-'),
                26,
            ),
            ExportColumn::make(
                'contact_person_phone',
                'Contact Phone',
                static fn (Vendor $m): string => (string) ($m->contact_person_phone ?? '-'),
                18,
            ),
            ExportColumn::make(
                'users_count',
                'Users',
                static fn (Vendor $m): int => (int) ($m->users_count ?? $m->users()->count()),
                10,
                'center',
            ),
            ExportColumn::make(
                'status',
                'Active',
                static fn (Vendor $m): string => $m->status ? 'Yes' : 'No',
                10,
                'center',
            ),
            ExportColumn::make(
                'remarks',
                'Remarks',
                static fn (Vendor $m): string => (string) ($m->remarks ?? '-'),
                30,
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (Vendor $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
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
        $query = Vendor::query()->withCount('users');

        return $query;
    }
}
