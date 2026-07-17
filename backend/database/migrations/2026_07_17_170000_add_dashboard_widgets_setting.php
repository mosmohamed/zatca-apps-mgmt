<?php

declare(strict_types=1);

use App\Support\DashboardWidgets;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('settings')->updateOrInsert(
            ['key' => DashboardWidgets::SETTING_KEY],
            [
                'value' => json_encode(DashboardWidgets::defaults(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widgets Visibility',
                'is_public' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );
    }

    public function down(): void
    {
        DB::table('settings')
            ->where('key', DashboardWidgets::SETTING_KEY)
            ->delete();
    }
};
