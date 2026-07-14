<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobTitle;
use Illuminate\Database\Seeder;

class JobTitleSeeder extends Seeder
{
    public function run(): void
    {
        $titles = [
            ['name_en' => 'System Administrator', 'name_ar' => 'مسؤول النظام', 'sort_order' => 1],
            ['name_en' => 'IT Manager', 'name_ar' => 'مدير تقنية المعلومات', 'sort_order' => 2],
            ['name_en' => 'Software Engineer', 'name_ar' => 'مهندس برمجيات', 'sort_order' => 3],
            ['name_en' => 'Business Analyst', 'name_ar' => 'محلل أعمال', 'sort_order' => 4],
            ['name_en' => 'Project Manager', 'name_ar' => 'مدير مشروع', 'sort_order' => 5],
            ['name_en' => 'Support Specialist', 'name_ar' => 'أخصائي دعم', 'sort_order' => 6],
            ['name_en' => 'Security Officer', 'name_ar' => 'مسؤول أمن', 'sort_order' => 7],
            ['name_en' => 'Database Administrator', 'name_ar' => 'مسؤول قواعد بيانات', 'sort_order' => 8],
        ];

        foreach ($titles as $index => $title) {
            JobTitle::query()->firstOrCreate(
                ['name_en' => $title['name_en']],
                [
                    'name_ar' => $title['name_ar'],
                    'description' => null,
                    'is_active' => true,
                    'sort_order' => $title['sort_order'],
                ],
            );
        }
    }
}
