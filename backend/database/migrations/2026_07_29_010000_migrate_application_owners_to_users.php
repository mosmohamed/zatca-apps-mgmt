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
        Schema::create('application_business_owners', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['application_id', 'user_id'], 'app_business_owners_unique');
            $table->index('user_id', 'app_business_owners_user_idx');
        });

        Schema::create('application_technical_owners', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['application_id', 'user_id'], 'app_technical_owners_unique');
            $table->index('user_id', 'app_technical_owners_user_idx');
        });

        $this->migrateLegacyOwnerStrings('business_owner', 'application_business_owners');
        $this->migrateLegacyOwnerStrings('technical_owner', 'application_technical_owners');

        Schema::table('applications', function (Blueprint $table): void {
            $table->dropColumn(['business_owner', 'technical_owner']);
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table): void {
            $table->string('business_owner')->nullable()->after('criticality_id');
            $table->string('technical_owner')->nullable()->after('business_owner');
        });

        $this->restoreLegacyOwnerStrings('business_owner', 'application_business_owners');
        $this->restoreLegacyOwnerStrings('technical_owner', 'application_technical_owners');

        Schema::dropIfExists('application_technical_owners');
        Schema::dropIfExists('application_business_owners');
    }

    private function migrateLegacyOwnerStrings(string $column, string $pivotTable): void
    {
        if (! Schema::hasColumn('applications', $column)) {
            return;
        }

        $rows = DB::table('applications')
            ->select(['id', $column])
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->get();

        $now = now();

        foreach ($rows as $row) {
            $raw = trim((string) $row->{$column});
            if ($raw === '') {
                continue;
            }

            $names = preg_split('/\s*,\s*/u', $raw) ?: [$raw];
            $userIds = [];

            foreach ($names as $name) {
                $normalized = trim((string) preg_replace('/\s+/u', ' ', $name));
                if ($normalized === '') {
                    continue;
                }

                $needle = mb_strtolower($normalized, 'UTF-8');
                $userId = DB::table('users')
                    ->whereRaw(
                        'LOWER(CONCAT(TRIM(first_name), \' \', TRIM(last_name))) = ?',
                        [$needle]
                    )
                    ->value('id');

                if ($userId !== null) {
                    $userIds[] = (int) $userId;
                }
            }

            foreach (array_values(array_unique($userIds)) as $userId) {
                DB::table($pivotTable)->insertOrIgnore([
                    'application_id' => (int) $row->id,
                    'user_id' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    private function restoreLegacyOwnerStrings(string $column, string $pivotTable): void
    {
        $grouped = DB::table($pivotTable)
            ->join('users', 'users.id', '=', $pivotTable.'.user_id')
            ->select([
                $pivotTable.'.application_id',
                DB::raw("GROUP_CONCAT(CONCAT(users.first_name, ' ', users.last_name) ORDER BY users.first_name SEPARATOR ', ') as names"),
            ])
            ->groupBy($pivotTable.'.application_id')
            ->get();

        foreach ($grouped as $row) {
            DB::table('applications')
                ->where('id', $row->application_id)
                ->update([$column => $row->names]);
        }
    }
};
