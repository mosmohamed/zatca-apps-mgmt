<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\AppRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApplicationAssignment>
 */
class ApplicationAssignmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'application_id' => Application::factory(),
            'user_id' => User::factory(),
            'app_role_id' => AppRole::factory(),
            'assigned_by' => User::factory(),
            'assigned_at' => now()->subDays(fake()->numberBetween(1, 90)),
            'ended_at' => null,
            'is_primary' => fake()->boolean(20),
            'remarks' => fake()->optional()->sentence(),
        ];
    }

    public function ended(): static
    {
        return $this->state(fn (array $attributes): array => [
            'ended_at' => now()->subDay(),
        ]);
    }

    public function primary(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_primary' => true,
        ]);
    }
}
