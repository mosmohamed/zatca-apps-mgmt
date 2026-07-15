<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\License;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<License>
 */
class LicenseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $licensed = fake()->numberBetween(10, 500);
        $used = fake()->numberBetween(0, $licensed);

        return [
            'publisher' => fake()->company(),
            'name' => fake()->words(3, true),
            'product' => fake()->words(2, true),
            'version' => fake()->optional()->numerify('#.#.#'),
            'description' => fake()->optional()->sentence(),
            'environment' => fake()->randomElement([
                'Production',
                'UAT',
                'Development',
                'DR',
                'Other',
            ]),
            'licensed' => $licensed,
            'used' => $used,
            'available' => max(0, $licensed - $used),
            'proof_of_entitlement' => fake()->optional()->url(),
            'start_date' => fake()->optional()->date(),
            'end_date' => fake()->optional()->dateTimeBetween('+60 days', '+2 years')?->format('Y-m-d'),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes): array => [
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);
    }

    public function expiringSoon(): static
    {
        return $this->state(fn (array $attributes): array => [
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->addDays(15)->toDateString(),
        ]);
    }
}
