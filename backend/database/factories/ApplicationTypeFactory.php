<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ApplicationType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ApplicationType>
 */
class ApplicationTypeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $englishName = fake()->unique()->words(2, true);

        return [
            'name_en' => Str::title($englishName),
            'name_ar' => 'نوع '.fake('ar_SA')->unique()->word(),
            'code' => Str::upper(Str::slug(fake()->unique()->bothify('???-###'), '_')),
        ];
    }
}
