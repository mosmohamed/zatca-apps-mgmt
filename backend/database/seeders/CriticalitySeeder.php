<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Criticality;
use Illuminate\Database\Seeder;

class CriticalitySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name_en' => 'Low', 'name_ar' => 'منخفض', 'code' => 'Low'],
            ['name_en' => 'Medium', 'name_ar' => 'متوسط', 'code' => 'Medium'],
            ['name_en' => 'High', 'name_ar' => 'مرتفع', 'code' => 'High'],
            ['name_en' => 'Critical', 'name_ar' => 'حرج', 'code' => 'Critical'],
        ];

        foreach ($items as $item) {
            Criticality::query()->firstOrCreate(['code' => $item['code']], [
                'name_en' => $item['name_en'],
                'name_ar' => $item['name_ar'],
                'is_active' => true,
            ]);
        }
    }
}
