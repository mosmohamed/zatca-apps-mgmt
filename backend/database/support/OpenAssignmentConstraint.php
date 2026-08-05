<?php

declare(strict_types=1);

namespace Database\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Portable uniqueness for "one open assignment per application + user".
 *
 * MySQL / MariaDB / SQLite: generated column + unique index (NULLs are distinct).
 * SQL Server: filtered unique index (NULLs collide in standard UNIQUE indexes).
 */
final class OpenAssignmentConstraint
{
    public const string INDEX_NAME = 'uq_open_assignment_per_app';

    public static function create(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlsrv') {
            DB::statement(
                'CREATE UNIQUE INDEX '.self::INDEX_NAME
                .' ON application_assignments (application_id, user_id)'
                .' WHERE ended_at IS NULL'
            );

            return;
        }

        Schema::table('application_assignments', function (Blueprint $table) use ($driver): void {
            if ($driver === 'sqlite') {
                $table->bigInteger('open_key')
                    ->nullable()
                    ->storedAs('CASE WHEN ended_at IS NULL THEN user_id ELSE NULL END');
            } else {
                $table->unsignedBigInteger('open_key')
                    ->nullable()
                    ->storedAs('CASE WHEN ended_at IS NULL THEN user_id ELSE NULL END');
            }

            $table->unique(['application_id', 'open_key'], self::INDEX_NAME);
        });
    }

    public static function drop(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlsrv') {
            DB::statement(
                'DROP INDEX IF EXISTS '.self::INDEX_NAME.' ON application_assignments'
            );

            return;
        }

        if (! Schema::hasTable('application_assignments')) {
            return;
        }

        if (Schema::hasIndex('application_assignments', self::INDEX_NAME)) {
            Schema::table('application_assignments', function (Blueprint $table): void {
                $table->dropUnique(self::INDEX_NAME);
            });
        }

        if (Schema::hasColumn('application_assignments', 'open_key')) {
            Schema::table('application_assignments', function (Blueprint $table): void {
                $table->dropColumn('open_key');
            });
        }
    }
}
