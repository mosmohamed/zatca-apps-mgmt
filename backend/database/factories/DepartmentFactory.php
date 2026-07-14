<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Department>
 */
class DepartmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $englishName = fake()->unique()->company().' Department';

        return [
            'name_en' => $englishName,
            'name_ar' => 'قسم '.fake('ar_SA')->unique()->company(),
        ];
    }
}
