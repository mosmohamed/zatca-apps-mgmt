<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class UsersExportDefinition implements ExportDefinitionInterface
{
    public function key(): string
    {
        return 'users';
    }

    public function permission(): string
    {
        return 'users.export';
    }

    public function filenamePrefix(): string
    {
        return 'Users';
    }

    public function reportTitle(): string
    {
        return 'Users Report';
    }

    public function sheetName(): string
    {
        return 'Users';
    }

    /**
     * @return list<string>
     */
    public function searchColumns(): array
    {
        return ['first_name', 'last_name', 'email', 'phone'];
    }

    /**
     * @return list<string>
     */
    public function sortableColumns(): array
    {
        return ['first_name', 'last_name', 'email', 'is_active', 'created_at', 'updated_at'];
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
            ExportColumn::make('full_name', 'Full Name', static fn (User $m): string => $m->full_name, 26),
            ExportColumn::make('email', 'Email', static fn (User $m): string => (string) $m->email, 28),
            ExportColumn::make('phone', 'Phone', static fn (User $m): string => (string) ($m->phone ?? '-'), 18),
            ExportColumn::make(
                'vendor',
                'Vendor',
                static fn (User $m): string => (string) ($m->vendor?->name ?? '-'),
                22,
            ),
            ExportColumn::make(
                'job_title',
                'Job Title',
                static fn (User $m): string => (string) ($m->jobTitle?->name_en ?? '-'),
                22,
            ),
            ExportColumn::make('teams', 'Teams', static fn (User $m): string => (string) ($m->teams ?? '-'), 18),
            ExportColumn::make(
                'whatsapp',
                'WhatsApp',
                static fn (User $m): string => (string) ($m->whatsapp ?? '-'),
                16,
            ),
            ExportColumn::make(
                'extension',
                'Extension',
                static fn (User $m): string => (string) ($m->extension ?? '-'),
                12,
                'center',
            ),
            ExportColumn::make(
                'is_active',
                'Active',
                static fn (User $m): string => $m->is_active ? 'Yes' : 'No',
                10,
                'center',
            ),
            ExportColumn::make(
                'created_at',
                'Created At',
                static fn (User $m): string => $m->created_at?->format('Y-m-d H:i') ?? '-',
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
        $query = User::query()->with(['vendor', 'jobTitle']);

        return $query;
    }
}
