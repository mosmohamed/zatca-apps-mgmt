<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<string>
     */
    private const array SOFT_DELETE_TABLES = [
        'applications',
        'users',
        'vendors',
        'licenses',
        'technologies',
    ];

    public function up(): void
    {
        Schema::table('activity_log', function (Blueprint $table): void {
            $table->index('created_at');
            $table->index(['subject_type', 'subject_id', 'created_at'], 'activity_log_subject_created_index');
            $table->index(['causer_type', 'causer_id', 'created_at'], 'activity_log_causer_created_index');
        });

        Schema::table('application_assignments', function (Blueprint $table): void {
            $table->index(['application_id', 'ended_at'], 'application_assignments_app_ended_index');
        });

        foreach (self::SOFT_DELETE_TABLES as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'deleted_at')) {
                continue;
            }

            if (Schema::hasIndex($tableName, $tableName.'_deleted_at_index')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                $table->index('deleted_at', $tableName.'_deleted_at_index');
            });
        }
    }

    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table): void {
            $table->dropIndex(['created_at']);
            $table->dropIndex('activity_log_subject_created_index');
            $table->dropIndex('activity_log_causer_created_index');
        });

        Schema::table('application_assignments', function (Blueprint $table): void {
            $table->dropIndex('application_assignments_app_ended_index');
        });

        foreach (self::SOFT_DELETE_TABLES as $tableName) {
            $indexName = $tableName.'_deleted_at_index';

            if (! Schema::hasTable($tableName) || ! Schema::hasIndex($tableName, $indexName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($indexName): void {
                $table->dropIndex($indexName);
            });
        }
    }
};
