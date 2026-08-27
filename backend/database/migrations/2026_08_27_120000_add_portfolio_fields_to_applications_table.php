<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table): void {
            if (! Schema::hasColumn('applications', 'description')) {
                $table->text('description')->nullable()->after('code');
            }

            if (! Schema::hasColumn('applications', 'technical_category')) {
                $table->string('technical_category')->nullable()->index()->after('description');
            }

            if (! Schema::hasColumn('applications', 'vendor_id')) {
                $table->foreignId('vendor_id')
                    ->nullable()
                    ->after('support_type_id')
                    ->constrained('vendors')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('applications', 'remarks')) {
                $table->text('remarks')->nullable()->after('repository_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table): void {
            if (Schema::hasColumn('applications', 'vendor_id')) {
                $table->dropConstrainedForeignId('vendor_id');
            }

            $drop = [];
            foreach (['description', 'technical_category', 'remarks'] as $column) {
                if (Schema::hasColumn('applications', $column)) {
                    $drop[] = $column;
                }
            }

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
