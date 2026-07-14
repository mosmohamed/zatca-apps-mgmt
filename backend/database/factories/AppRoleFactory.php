<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AppRole;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AppRole>
 */
class AppRoleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->jobTitle(),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }
}
