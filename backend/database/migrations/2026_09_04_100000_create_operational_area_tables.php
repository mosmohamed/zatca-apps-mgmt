<?php

declare(strict_types=1);

use App\Enums\OperationalArea;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_operational_areas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('area', 64);
            $table->timestamps();

            $table->unique(['user_id', 'area']);
            $table->index('area');
        });

        Schema::create('vendor_operational_areas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->string('area', 64);
            $table->timestamps();

            $table->unique(['vendor_id', 'area']);
            $table->index('area');
        });

        $this->backfillUserAreas();
        $this->backfillVendorAreas();
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_operational_areas');
        Schema::dropIfExists('user_operational_areas');
    }

    private function backfillUserAreas(): void
    {
        $now = now();

        $applicationUserIds = DB::table('application_assignments')
            ->whereNull('ended_at')
            ->pluck('user_id');

        if (Schema::hasTable('application_business_owners')) {
            $applicationUserIds = $applicationUserIds->merge(
                DB::table('application_business_owners')->pluck('user_id')
            );
        }

        if (Schema::hasTable('application_technical_owners')) {
            $applicationUserIds = $applicationUserIds->merge(
                DB::table('application_technical_owners')->pluck('user_id')
            );
        }

        $this->insertUserAreas($applicationUserIds->unique()->all(), OperationalArea::Application->value, $now);

        if (Schema::hasTable('infra_team_assignments')) {
            $this->insertUserAreas(
                DB::table('infra_team_assignments')->distinct()->pluck('user_id')->all(),
                OperationalArea::Infra->value,
                $now,
            );
        }

        if (Schema::hasTable('service_desk_team_assignments')) {
            $this->insertUserAreas(
                DB::table('service_desk_team_assignments')->distinct()->pluck('user_id')->all(),
                OperationalArea::ServiceDesk->value,
                $now,
            );
        }
    }

    private function backfillVendorAreas(): void
    {
        if (! Schema::hasTable('applications')) {
            return;
        }

        $vendorIds = DB::table('applications')
            ->whereNotNull('vendor_id')
            ->distinct()
            ->pluck('vendor_id')
            ->all();

        $now = now();
        $rows = [];
        foreach ($vendorIds as $vendorId) {
            $rows[] = [
                'vendor_id' => (int) $vendorId,
                'area' => OperationalArea::Application->value,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('vendor_operational_areas')->insertOrIgnore($chunk);
        }
    }

    /**
     * @param  list<mixed>  $userIds
     */
    private function insertUserAreas(array $userIds, string $area, mixed $now): void
    {
        $rows = [];
        foreach ($userIds as $userId) {
            $id = (int) $userId;
            if ($id <= 0) {
                continue;
            }
            $rows[] = [
                'user_id' => $id,
                'area' => $area,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('user_operational_areas')->insertOrIgnore($chunk);
        }
    }
};
