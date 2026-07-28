<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Environment;
use Illuminate\Database\Seeder;

class EnvironmentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'DEV', 'name_en' => 'Development', 'name_ar' => 'التطوير', 'sort_order' => 1],
            ['code' => 'TEST', 'name_en' => 'Testing', 'name_ar' => 'الاختبار', 'sort_order' => 2],
            ['code' => 'STG', 'name_en' => 'Staging', 'name_ar' => 'التهيئة', 'sort_order' => 3],
            ['code' => 'PROD', 'name_en' => 'Production', 'name_ar' => 'الإنتاج', 'sort_order' => 4],
        ];

        foreach ($items as $item) {
            Environment::query()->updateOrCreate(['code' => $item['code']], [
                'name_en' => $item['name_en'],
                'name_ar' => $item['name_ar'],
                'sort_order' => $item['sort_order'],
                'is_active' => true,
            ]);
        }
    }
}
