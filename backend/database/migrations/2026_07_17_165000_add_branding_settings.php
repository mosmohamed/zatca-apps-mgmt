<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * @var list<array{key: string, value: string, label: string}>
     */
    private const array SETTINGS = [
        [
            'key' => 'sidebar_tagline_en',
            'value' => 'Access Management',
            'label' => 'Sidebar Tagline (English)',
        ],
        [
            'key' => 'sidebar_tagline_ar',
            'value' => 'إدارة الصلاحيات',
            'label' => 'Sidebar Tagline (Arabic)',
        ],
        [
            'key' => 'header_subtitle_en',
            'value' => 'ZATCA Applications Operations & Access Management',
            'label' => 'Header Subtitle (English)',
        ],
        [
            'key' => 'header_subtitle_ar',
            'value' => 'نظام ادارة التطبيقات وإدارة الصلاحيات في هيئة الزكاة والضريبة والجمارك',
            'label' => 'Header Subtitle (Arabic)',
        ],
    ];

    public function up(): void
    {
        $now = now();

        foreach (self::SETTINGS as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => 'string',
                    'group' => 'branding',
                    'label' => $setting['label'],
                    'is_public' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')
            ->whereIn('key', array_column(self::SETTINGS, 'key'))
            ->delete();
    }
};
