<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ApplicationStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ApplicationStatus>
 */
class ApplicationStatusFactory extends Factory
{
    protected $model = ApplicationStatus::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name_en' => Str::title($name),
            'name_ar' => 'حالة '.fake('ar_SA')->word(),
            'code' => Str::title($name),
            'is_active' => true,
        ];
    }
}
