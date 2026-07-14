<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SupportType;
use Illuminate\Database\Seeder;

class SupportTypeSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name_en' => '24x7', 'name_ar' => '24x7', 'code' => '24x7'],
            ['name_en' => 'Business Hours', 'name_ar' => 'ساعات العمل', 'code' => 'Business Hours'],
            ['name_en' => 'Best Effort', 'name_ar' => 'أفضل جهد', 'code' => 'Best Effort'],
        ];

        foreach ($items as $item) {
            SupportType::query()->firstOrCreate(['code' => $item['code']], [
                'name_en' => $item['name_en'],
                'name_ar' => $item['name_ar'],
                'is_active' => true,
            ]);
        }
    }
}
