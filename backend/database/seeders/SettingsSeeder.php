<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'company_name',
                'value' => 'ZATCA IT Portfolio',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Company Name',
                'is_public' => true,
            ],
            [
                'key' => 'company_logo_path',
                'value' => 'branding/logo.png',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Company Logo Path',
                'is_public' => true,
            ],
            [
                'key' => 'default_timezone',
                'value' => 'Asia/Riyadh',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Default Timezone',
                'is_public' => true,
            ],
            [
                'key' => 'default_pagination_size',
                'value' => '15',
                'type' => 'integer',
                'group' => 'general',
                'label' => 'Default Pagination Size',
                'is_public' => true,
            ],
            [
                'key' => 'session_timeout_minutes',
                'value' => '120',
                'type' => 'integer',
                'group' => 'security',
                'label' => 'Session Timeout (Minutes)',
                'is_public' => true,
            ],
            [
                'key' => 'export_header_color',
                'value' => '1F4E79',
                'type' => 'string',
                'group' => 'export',
                'label' => 'Export Header Color',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::query()->firstOrCreate(
                ['key' => $setting['key']],
                $setting,
            );
        }
    }
}
