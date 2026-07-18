<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name_en' => 'Customes', 'name_ar' => 'ادارة الجمارك'],
            ['name_en' => 'taxation and Zakat Department', 'name_ar' => 'ادارة الضرائب والزكاة'],
        ];

        foreach ($departments as $department) {
            Department::query()->firstOrCreate(
                ['name_en' => $department['name_en']],
                $department,
            );
        }
    }
}
