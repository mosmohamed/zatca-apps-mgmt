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
            $table->string('business_owner')->nullable();
            $table->string('technical_owner')->nullable();
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

        $usersByName = $this->usersByNormalizedFullName();

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
                $normalized = $this->normalizePersonName((string) $name);
                if ($normalized === '') {
                    continue;
                }

                $userId = $usersByName[$normalized] ?? null;
                if ($userId !== null) {
                    $userIds[] = $userId;
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
        $rows = DB::table($pivotTable)
            ->join('users', 'users.id', '=', $pivotTable.'.user_id')
            ->select([
                $pivotTable.'.application_id',
                'users.first_name',
                'users.last_name',
            ])
            ->orderBy('users.first_name')
            ->orderBy('users.last_name')
            ->get();

        $namesByApplication = [];

        foreach ($rows as $row) {
            $applicationId = (int) $row->application_id;
            $fullName = trim((string) $row->first_name.' '.(string) $row->last_name);
            if ($fullName === '') {
                continue;
            }

            $namesByApplication[$applicationId][] = $fullName;
        }

        foreach ($namesByApplication as $applicationId => $names) {
            DB::table('applications')
                ->where('id', $applicationId)
                ->update([$column => implode(', ', $names)]);
        }
    }

    /**
     * @return array<string, int>
     */
    private function usersByNormalizedFullName(): array
    {
        $map = [];

        foreach (DB::table('users')->select(['id', 'first_name', 'last_name'])->get() as $user) {
            $normalized = $this->normalizePersonName(
                trim((string) $user->first_name.' '.(string) $user->last_name)
            );

            if ($normalized === '' || isset($map[$normalized])) {
                continue;
            }

            $map[$normalized] = (int) $user->id;
        }

        return $map;
    }

    private function normalizePersonName(string $name): string
    {
        $collapsed = trim((string) preg_replace('/\s+/u', ' ', $name));

        if ($collapsed === '') {
            return '';
        }

        return mb_strtolower($collapsed, 'UTF-8');
    }
};
