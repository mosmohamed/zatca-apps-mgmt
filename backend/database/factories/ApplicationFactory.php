<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\SupportType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $englishName = fake()->unique()->words(3, true);

        return [
            'department_id' => Department::factory(),
            'application_type_id' => ApplicationType::factory(),
            'name_en' => Str::title($englishName),
            'name_ar' => 'تطبيق '.fake('ar_SA')->unique()->words(2, true),
            'code' => Str::upper(Str::slug(fake()->unique()->bothify('APP-???-###'), '-')),
            'status_id' => fn (): int => $this->resolveStatusId(),
            'criticality_id' => fn (): int => $this->resolveCriticalityId(),
            'support_type_id' => fn (): int => $this->resolveSupportTypeId(),
            'business_owner' => fake()->optional()->name(),
            'technical_owner' => fake()->optional()->name(),
            'documentation_url' => fake()->optional()->url(),
            'repository_url' => fake()->optional()->url(),
            'created_by' => null,
            'updated_by' => null,
        ];
    }

    public function createdBy(User $user): static
    {
        return $this->state(fn (array $attributes): array => [
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    private function resolveStatusId(): int
    {
        $existing = ApplicationStatus::query()->inRandomOrder()->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        return ApplicationStatus::query()->create([
            'name_en' => 'Active',
            'name_ar' => 'نشط',
            'code' => 'Active',
            'is_active' => true,
        ])->id;
    }

    private function resolveCriticalityId(): int
    {
        $existing = Criticality::query()->inRandomOrder()->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        return Criticality::query()->create([
            'name_en' => 'Medium',
            'name_ar' => 'متوسط',
            'code' => 'Medium',
            'is_active' => true,
        ])->id;
    }

    private function resolveSupportTypeId(): int
    {
        $existing = SupportType::query()->inRandomOrder()->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        return SupportType::query()->create([
            'name_en' => 'Business Hours',
            'name_ar' => 'ساعات العمل',
            'code' => 'Business Hours',
            'is_active' => true,
        ])->id;
    }
}
