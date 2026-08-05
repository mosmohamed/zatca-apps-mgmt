<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * spatie/laravel-activitylog v4 writes a batch_uuid on every activity and keeps
     * attribute changes inside the properties payload, so databases created with the
     * v5 column layout need reconciling.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('activity_log', 'batch_uuid')) {
            Schema::table('activity_log', function (Blueprint $table): void {
                $table->uuid('batch_uuid')->nullable();
            });
        }

        if (Schema::hasColumn('activity_log', 'attribute_changes')) {
            Schema::table('activity_log', function (Blueprint $table): void {
                $table->dropColumn('attribute_changes');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('activity_log', 'attribute_changes')) {
            Schema::table('activity_log', function (Blueprint $table): void {
                $table->json('attribute_changes')->nullable();
            });
        }

        if (Schema::hasColumn('activity_log', 'batch_uuid')) {
            Schema::table('activity_log', function (Blueprint $table): void {
                $table->dropColumn('batch_uuid');
            });
        }
    }
};
