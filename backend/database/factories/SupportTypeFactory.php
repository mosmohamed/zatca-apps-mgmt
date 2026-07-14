<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SupportType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SupportType>
 */
class SupportTypeFactory extends Factory
{
    protected $model = SupportType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name_en' => Str::title($name),
            'name_ar' => 'دعم '.fake('ar_SA')->word(),
            'code' => Str::upper(Str::slug($name, '_')),
            'is_active' => true,
        ];
    }
}
