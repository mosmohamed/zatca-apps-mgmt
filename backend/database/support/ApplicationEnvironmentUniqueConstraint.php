<?php

declare(strict_types=1);

namespace Database\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Portable uniqueness for one active environment profile per application + environment.
 *
 * Soft-deleted rows must not block recreating the same pair.
 *
 * MySQL / MariaDB / SQLite: generated column + unique index (NULLs are distinct).
 * SQL Server: filtered unique index (NULLs collide in standard UNIQUE indexes).
 */
final class ApplicationEnvironmentUniqueConstraint
{
    public const string INDEX_NAME = 'uq_open_app_environment';

    public const string GENERATED_COLUMN = 'open_environment_key';

    public static function create(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlsrv') {
            DB::statement(
                'CREATE UNIQUE INDEX '.self::INDEX_NAME
                .' ON application_environments (application_id, environment_id)'
                .' WHERE deleted_at IS NULL'
            );

            return;
        }

        Schema::table('application_environments', function (Blueprint $table) use ($driver): void {
            if ($driver === 'sqlite') {
                $table->bigInteger(self::GENERATED_COLUMN)
                    ->nullable()
                    ->storedAs('CASE WHEN deleted_at IS NULL THEN environment_id ELSE NULL END');
            } else {
                $table->unsignedBigInteger(self::GENERATED_COLUMN)
                    ->nullable()
                    ->storedAs('CASE WHEN deleted_at IS NULL THEN environment_id ELSE NULL END');
            }

            $table->unique(['application_id', self::GENERATED_COLUMN], self::INDEX_NAME);
        });
    }

    public static function drop(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlsrv') {
            DB::statement(
                'DROP INDEX IF EXISTS '.self::INDEX_NAME.' ON application_environments'
            );

            return;
        }

        if (! Schema::hasTable('application_environments')) {
            return;
        }

        if (Schema::hasIndex('application_environments', self::INDEX_NAME)) {
            Schema::table('application_environments', function (Blueprint $table): void {
                $table->dropUnique(self::INDEX_NAME);
            });
        }

        if (Schema::hasColumn('application_environments', self::GENERATED_COLUMN)) {
            Schema::table('application_environments', function (Blueprint $table): void {
                $table->dropColumn(self::GENERATED_COLUMN);
            });
        }
    }
}
