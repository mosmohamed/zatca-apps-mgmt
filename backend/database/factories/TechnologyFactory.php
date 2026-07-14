<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\TechnologyCategory;
use App\Models\Technology;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Technology>
 */
class TechnologyFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'category' => fake()->randomElement(TechnologyCategory::cases()),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
