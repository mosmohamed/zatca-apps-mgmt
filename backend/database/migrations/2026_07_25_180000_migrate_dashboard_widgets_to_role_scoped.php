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
        $row = DB::table('settings')
            ->where('key', DashboardWidgets::SETTING_KEY)
            ->first();

        $decoded = null;
        if ($row !== null && is_string($row->value) && $row->value !== '') {
            $decoded = json_decode($row->value, true);
        }

        $config = DashboardWidgets::normalizeConfig($decoded);

        DB::table('settings')->updateOrInsert(
            ['key' => DashboardWidgets::SETTING_KEY],
            [
                'value' => json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widgets Visibility',
                'is_public' => true,
                'created_at' => $row->created_at ?? $now,
                'updated_at' => $now,
            ],
        );
    }

    public function down(): void
    {
        $row = DB::table('settings')
            ->where('key', DashboardWidgets::SETTING_KEY)
            ->first();

        if ($row === null) {
            return;
        }

        $decoded = is_string($row->value) ? json_decode($row->value, true) : null;
        $flat = DashboardWidgets::defaults();

        if (is_array($decoded) && isset($decoded['roles']) && is_array($decoded['roles'])) {
            $first = reset($decoded['roles']);
            if (is_array($first)) {
                $flat = DashboardWidgets::normalizeRoleMap($first);
            }
        } elseif (is_array($decoded)) {
            $flat = DashboardWidgets::normalizeRoleMap($decoded);
        }

        DB::table('settings')
            ->where('key', DashboardWidgets::SETTING_KEY)
            ->update([
                'value' => json_encode($flat, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_at' => now(),
            ]);
    }
};
