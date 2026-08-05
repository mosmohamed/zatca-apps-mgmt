<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('infra_levels', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 100)->unique();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('note_en')->nullable();
            $table->string('note_ar')->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('infra_categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('infra_categories')
                ->cascadeOnDelete();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('code', 100)->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index('parent_id');
            $table->index(['parent_id', 'sort_order']);
        });

        Schema::create('infra_team_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('infra_category_id')
                ->constrained('infra_categories')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->noActionOnDelete();
            $table->foreignId('infra_level_id')
                ->constrained('infra_levels')
                ->noActionOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(
                ['infra_category_id', 'user_id', 'infra_level_id'],
                'uq_infra_team_assignment'
            );
            $table->index(['infra_category_id', 'infra_level_id'], 'infra_team_cat_level_idx');
            $table->index('user_id', 'infra_team_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('infra_team_assignments');
        Schema::dropIfExists('infra_categories');
        Schema::dropIfExists('infra_levels');
    }
};
