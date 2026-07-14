<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ApplicationStatus;
use Illuminate\Database\Seeder;

class ApplicationStatusSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name_en' => 'Active', 'name_ar' => 'نشط', 'code' => 'Active'],
            ['name_en' => 'Maintenance', 'name_ar' => 'صيانة', 'code' => 'Maintenance'],
            ['name_en' => 'Retired', 'name_ar' => 'منتهي', 'code' => 'Retired'],
            ['name_en' => 'Archived', 'name_ar' => 'مؤرشف', 'code' => 'Archived'],
        ];

        foreach ($items as $item) {
            ApplicationStatus::query()->firstOrCreate(['code' => $item['code']], [
                'name_en' => $item['name_en'],
                'name_ar' => $item['name_ar'],
                'is_active' => true,
            ]);
        }
    }
}
