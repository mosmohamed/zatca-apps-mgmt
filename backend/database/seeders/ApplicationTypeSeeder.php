<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ApplicationType;
use Illuminate\Database\Seeder;

class ApplicationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name_en' => 'API', 'name_ar' => 'واجهة برمجة تطبيقات', 'code' => 'API'],
            ['name_en' => 'Web Portal', 'name_ar' => 'بوابة ويب', 'code' => 'WEB_PORTAL'],
            ['name_en' => 'Mobile App', 'name_ar' => 'تطبيق جوال', 'code' => 'MOBILE_APP'],
            ['name_en' => 'Microservice', 'name_ar' => 'خدمة مصغرة', 'code' => 'MICROSERVICE'],
            ['name_en' => 'Desktop Application', 'name_ar' => 'تطبيق سطح المكتب', 'code' => 'DESKTOP_APP'],
            ['name_en' => 'SaaS Platform', 'name_ar' => 'منصة سحابية', 'code' => 'SAAS'],
            ['name_en' => 'Customs', 'name_ar' => 'جمارك', 'code' => 'CUSTOMS'],
            ['name_en' => 'Internal App', 'name_ar' => 'تطبيق داخلي', 'code' => 'INTERNAL_APP'],
        ];

        foreach ($types as $type) {
            ApplicationType::query()->firstOrCreate(
                ['code' => $type['code']],
                $type,
            );
        }
    }
}
