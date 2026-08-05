<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $this->seedMasterRowIfMissing('application_statuses', [
            ['name_en' => 'Active', 'name_ar' => 'نشط', 'code' => 'Active'],
            ['name_en' => 'Maintenance', 'name_ar' => 'صيانة', 'code' => 'Maintenance'],
            ['name_en' => 'Retired', 'name_ar' => 'متقاعد', 'code' => 'Retired'],
            ['name_en' => 'Archived', 'name_ar' => 'مؤرشف', 'code' => 'Archived'],
        ], $now);

        $this->seedMasterRowIfMissing('criticalities', [
            ['name_en' => 'Low', 'name_ar' => 'منخفض', 'code' => 'Low'],
            ['name_en' => 'Medium', 'name_ar' => 'متوسط', 'code' => 'Medium'],
            ['name_en' => 'High', 'name_ar' => 'مرتفع', 'code' => 'High'],
            ['name_en' => 'Critical', 'name_ar' => 'حرج', 'code' => 'Critical'],
        ], $now);

        $this->seedMasterRowIfMissing('support_types', [
            ['name_en' => '24x7', 'name_ar' => '24x7', 'code' => '24x7'],
            ['name_en' => 'Business Hours', 'name_ar' => 'ساعات العمل', 'code' => 'Business Hours'],
            ['name_en' => 'Best Effort', 'name_ar' => 'أفضل جهد', 'code' => 'Best Effort'],
        ], $now);

        if (! Schema::hasColumn('applications', 'status_id')) {
            Schema::table('applications', function (Blueprint $table): void {
                // Nullable + NO ACTION: engines forbid SET NULL on columns that later become NOT NULL.
                $table->foreignId('status_id')->nullable()->constrained('application_statuses')->noActionOnDelete();
                $table->foreignId('criticality_id')->nullable()->constrained('criticalities')->noActionOnDelete();
                $table->foreignId('support_type_id')->nullable()->constrained('support_types')->noActionOnDelete();
            });
        }

        if (Schema::hasColumn('applications', 'status')) {
            $statusMap = DB::table('application_statuses')->pluck('id', 'code');
            $criticalityMap = DB::table('criticalities')->pluck('id', 'code');
            $supportTypeMap = DB::table('support_types')->pluck('id', 'code');

            DB::table('applications')->orderBy('id')->chunkById(100, function ($applications) use ($statusMap, $criticalityMap, $supportTypeMap): void {
                foreach ($applications as $application) {
                    DB::table('applications')
                        ->where('id', $application->id)
                        ->update([
                            'status_id' => $statusMap[$application->status] ?? $statusMap['Active'],
                            'criticality_id' => $criticalityMap[$application->criticality] ?? $criticalityMap['Medium'],
                            'support_type_id' => $supportTypeMap[$application->support_type] ?? $supportTypeMap['Business Hours'],
                        ]);
                }
            });

            Schema::table('applications', function (Blueprint $table) {
                if (Schema::getConnection()->getDriverName() === 'sqlite') {
                    $table->dropIndex(['status']);
                    $table->dropIndex(['criticality']);
                }

                $table->dropColumn(['status', 'criticality', 'support_type']);
            });
        }

        // Ensure every row has FKs before forcing NOT NULL (covers partial prior runs).
        $defaultStatusId = (int) DB::table('application_statuses')->where('code', 'Active')->value('id');
        $defaultCriticalityId = (int) DB::table('criticalities')->where('code', 'Medium')->value('id');
        $defaultSupportTypeId = (int) DB::table('support_types')->where('code', 'Business Hours')->value('id');

        DB::table('applications')->whereNull('status_id')->update(['status_id' => $defaultStatusId]);
        DB::table('applications')->whereNull('criticality_id')->update(['criticality_id' => $defaultCriticalityId]);
        DB::table('applications')->whereNull('support_type_id')->update(['support_type_id' => $defaultSupportTypeId]);

        // Drop FKs first — MySQL error 1830 if SET NULL FKs remain while changing to NOT NULL.
        // Laravel recreates SQLite tables for change(), so keep the same path for all drivers.
        $this->dropApplicationMasterForeignKeys();

        Schema::table('applications', function (Blueprint $table): void {
            // Keep unsignedBigInteger to match id() on MySQL. SQL Server maps UNSIGNED to signed bigint.
            $table->unsignedBigInteger('status_id')->nullable(false)->change();
            $table->unsignedBigInteger('criticality_id')->nullable(false)->change();
            $table->unsignedBigInteger('support_type_id')->nullable(false)->change();
        });

        Schema::table('applications', function (Blueprint $table): void {
            $table->foreign('status_id')->references('id')->on('application_statuses')->noActionOnDelete();
            $table->foreign('criticality_id')->references('id')->on('criticalities')->noActionOnDelete();
            $table->foreign('support_type_id')->references('id')->on('support_types')->noActionOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('applications', 'status')) {
            Schema::table('applications', function (Blueprint $table): void {
                $table->string('status')->default('Active');
                $table->string('criticality')->default('Medium');
                $table->string('support_type')->default('Business Hours');
            });
        }

        if (Schema::hasColumn('applications', 'status_id')) {
            $statusMap = DB::table('application_statuses')->pluck('code', 'id');
            $criticalityMap = DB::table('criticalities')->pluck('code', 'id');
            $supportTypeMap = DB::table('support_types')->pluck('code', 'id');

            DB::table('applications')->orderBy('id')->chunkById(100, function ($applications) use ($statusMap, $criticalityMap, $supportTypeMap): void {
                foreach ($applications as $application) {
                    DB::table('applications')
                        ->where('id', $application->id)
                        ->update([
                            'status' => $statusMap[$application->status_id] ?? 'Active',
                            'criticality' => $criticalityMap[$application->criticality_id] ?? 'Medium',
                            'support_type' => $supportTypeMap[$application->support_type_id] ?? 'Business Hours',
                        ]);
                }
            });

            $this->dropApplicationMasterForeignKeys();

            Schema::table('applications', function (Blueprint $table) {
                $table->dropColumn(['status_id', 'criticality_id', 'support_type_id']);
            });
        }
    }

    /**
     * @param  list<array{name_en: string, name_ar: string, code: string}>  $rows
     */
    private function seedMasterRowIfMissing(string $table, array $rows, mixed $now): void
    {
        foreach ($rows as $row) {
            $exists = DB::table($table)->where('code', $row['code'])->exists();
            if ($exists) {
                continue;
            }

            DB::table($table)->insert([
                ...$row,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function dropApplicationMasterForeignKeys(): void
    {
        $sm = Schema::getConnection()->getSchemaBuilder();
        $foreignKeys = $sm->getForeignKeys('applications');
        $names = collect($foreignKeys)->pluck('name')->all();

        Schema::table('applications', function (Blueprint $table) use ($names): void {
            foreach (['applications_status_id_foreign', 'applications_criticality_id_foreign', 'applications_support_type_id_foreign'] as $name) {
                if (in_array($name, $names, true)) {
                    $table->dropForeign($name);
                }
            }
        });
    }
};
