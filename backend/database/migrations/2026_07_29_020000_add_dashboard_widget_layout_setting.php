<?php

declare(strict_types=1);

use App\Models\Setting;
use App\Support\DashboardWidgetLayout;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Setting::query()->firstOrCreate(
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
            ],
        );
    }

    public function down(): void
    {
        Setting::query()->where('key', DashboardWidgetLayout::SETTING_KEY)->delete();
    }
};
