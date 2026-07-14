<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\TechnologyCategory;
use App\Models\Technology;
use Illuminate\Database\Seeder;

class TechnologySeeder extends Seeder
{
    public function run(): void
    {
        $technologies = [
            ['name' => 'React', 'category' => TechnologyCategory::Frontend, 'description' => 'Component-based UI library'],
            ['name' => 'Vue.js', 'category' => TechnologyCategory::Frontend, 'description' => 'Progressive JavaScript framework'],
            ['name' => 'Angular', 'category' => TechnologyCategory::Frontend, 'description' => 'TypeScript-based web framework'],
            ['name' => 'Laravel', 'category' => TechnologyCategory::Backend, 'description' => 'PHP web application framework'],
            ['name' => 'Node.js', 'category' => TechnologyCategory::Backend, 'description' => 'JavaScript runtime for servers'],
            ['name' => '.NET', 'category' => TechnologyCategory::Backend, 'description' => 'Microsoft application platform'],
            ['name' => 'MySQL', 'category' => TechnologyCategory::Database, 'description' => 'Relational database engine'],
            ['name' => 'PostgreSQL', 'category' => TechnologyCategory::Database, 'description' => 'Advanced relational database'],
            ['name' => 'MongoDB', 'category' => TechnologyCategory::Database, 'description' => 'Document-oriented database'],
            ['name' => 'AWS', 'category' => TechnologyCategory::Cloud, 'description' => 'Amazon Web Services'],
            ['name' => 'Azure', 'category' => TechnologyCategory::Cloud, 'description' => 'Microsoft Azure cloud platform'],
            ['name' => 'Docker', 'category' => TechnologyCategory::Cloud, 'description' => 'Container runtime platform'],
            ['name' => 'Flutter', 'category' => TechnologyCategory::Mobile, 'description' => 'Cross-platform mobile toolkit'],
            ['name' => 'React Native', 'category' => TechnologyCategory::Mobile, 'description' => 'Native mobile apps with React'],
            ['name' => 'Redis', 'category' => TechnologyCategory::Other, 'description' => 'In-memory data store'],
        ];

        foreach ($technologies as $technology) {
            Technology::query()->updateOrCreate(
                ['name' => $technology['name']],
                [
                    'category' => $technology['category'],
                    'description' => $technology['description'],
                    'is_active' => true,
                ],
            );
        }
    }
}
