<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Criticality;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Criticality>
 */
class CriticalityFactory extends Factory
{
    protected $model = Criticality::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name_en' => Str::title($name),
            'name_ar' => 'أهمية '.fake('ar_SA')->word(),
            'code' => Str::title($name),
            'is_active' => true,
        ];
    }
}
