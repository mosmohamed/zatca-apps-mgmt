<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\JobTitle;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password = null;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'vendor_id' => null,
            'phone' => fake()->optional()->e164PhoneNumber(),
            'teams' => fake()->optional()->userName(),
            'whatsapp' => fake()->optional()->e164PhoneNumber(),
            'extension' => fake()->optional()->numerify('####'),
            'job_title_id' => null,
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes): array => [
            'email_verified_at' => null,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }

    public function forVendor(?Vendor $vendor = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'vendor_id' => $vendor?->id ?? Vendor::factory(),
        ]);
    }

    public function withJobTitle(?JobTitle $jobTitle = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'job_title_id' => $jobTitle?->id ?? JobTitle::factory(),
        ]);
    }
}
