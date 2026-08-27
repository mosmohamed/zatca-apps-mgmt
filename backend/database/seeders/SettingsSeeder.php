<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use App\Support\DashboardWidgets;
use App\Support\DashboardWidgetLayout;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'company_name',
                'value' => 'CENTRIX',
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
                'value' => '',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Sidebar Tagline (English)',
                'is_public' => true,
            ],
            [
                'key' => 'sidebar_tagline_ar',
                'value' => '',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Sidebar Tagline (Arabic)',
                'is_public' => true,
            ],
            [
                'key' => 'header_subtitle_en',
                'value' => 'ZATCA Applications Operations',
                'type' => 'string',
                'group' => 'branding',
                'label' => 'Header Subtitle (English)',
                'is_public' => true,
            ],
            [
                'key' => 'header_subtitle_ar',
                'value' => 'نظام ادارة التطبيقات في هيئة الزكاة والضريبة والجمارك',
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
                'key' => 'login_default_credentials_enabled',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'security',
                'label' => 'Show Default Login Credentials',
                'is_public' => true,
            ],
            [
                'key' => 'login_default_email',
                'value' => 'viewer@zatca.gov.sa',
                'type' => 'string',
                'group' => 'security',
                'label' => 'Default Login Email',
                'is_public' => true,
            ],
            [
                'key' => 'login_default_password',
                'value' => 'password',
                'type' => 'string',
                'group' => 'security',
                'label' => 'Default Login Password',
                'is_public' => true,
            ],
            [
                'key' => DashboardWidgets::SETTING_KEY,
                'value' => json_encode(DashboardWidgets::normalizeConfig(null), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widgets Visibility',
                'is_public' => true,
            ],
            [
                'key' => DashboardWidgetLayout::SETTING_KEY,
                'value' => json_encode(DashboardWidgetLayout::defaults(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widget Layout',
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
            [
                'key' => 'login_default_credentials_enabled',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'security',
                'label' => 'Show Default Login Credentials',
                'is_public' => true,
            ],
            [
                'key' => 'login_default_email',
                'value' => 'viewer@zatca.gov.sa',
                'type' => 'string',
                'group' => 'security',
                'label' => 'Default Login Email',
                'is_public' => true,
            ],
            [
                'key' => 'login_default_password',
                'value' => 'password',
                'type' => 'string',
                'group' => 'security',
                'label' => 'Default Login Password',
                'is_public' => true,
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
