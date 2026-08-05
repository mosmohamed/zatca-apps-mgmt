<?php

declare(strict_types=1);

use App\Support\DashboardWidgetLayout;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('settings')->updateOrInsert(
            ['key' => DashboardWidgetLayout::SETTING_KEY],
            [
                'value' => json_encode(
                    DashboardWidgetLayout::defaults(),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                ),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widget Layout',
                'is_public' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );
    }

    public function down(): void
    {
        DB::table('settings')
            ->where('key', DashboardWidgetLayout::SETTING_KEY)
            ->delete();
    }
};
