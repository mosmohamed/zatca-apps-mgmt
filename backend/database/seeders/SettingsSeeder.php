<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use App\Support\AuthenticationMode;
use App\Support\AuthenticationRoleMappingSettings;
use App\Support\DashboardWidgets;
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
                'key' => 'sidebar_tagline_en',
                'value' => 'Access Management',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Sidebar Tagline (English)',
                'is_public' => true,
            ],
            [
                'key' => 'sidebar_tagline_ar',
                'value' => 'إدارة الصلاحيات',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Sidebar Tagline (Arabic)',
                'is_public' => true,
            ],
            [
                'key' => 'header_subtitle_en',
                'value' => 'ZATCA Applications Operations & Access Management',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Header Subtitle (English)',
                'is_public' => true,
            ],
            [
                'key' => 'header_subtitle_ar',
                'value' => 'نظام ادارة التطبيقات وإدارة الصلاحيات في هيئة الزكاة والضريبة والجمارك',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Header Subtitle (Arabic)',
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
                'key' => DashboardWidgets::SETTING_KEY,
                'value' => json_encode(DashboardWidgets::defaults(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widgets Visibility',
                'is_public' => true,
            ],
            [
                'key' => AuthenticationMode::KEY,
                'value' => AuthenticationMode::defaults(),
                'type' => 'string',
                'group' => 'authentication',
                'label' => 'Authentication Mode',
                'is_public' => true,
            ],
            [
                'key' => AuthenticationRoleMappingSettings::KEY,
                'value' => json_encode(
                    AuthenticationRoleMappingSettings::defaults(),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                ),
                'type' => 'json',
                'group' => 'authentication',
                'label' => 'External Authentication Role Mapping',
                'is_public' => false,
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
