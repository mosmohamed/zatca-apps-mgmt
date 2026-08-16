<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_desk_levels', function (Blueprint $table): void {
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

        Schema::create('service_desk_categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('service_desk_categories')
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

        Schema::create('service_desk_team_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_desk_category_id')
                ->constrained('service_desk_categories')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->noActionOnDelete();
            $table->foreignId('service_desk_level_id')
                ->constrained('service_desk_levels')
                ->noActionOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(
                ['service_desk_category_id', 'user_id', 'service_desk_level_id'],
                'uq_service_desk_team_assignment'
            );
            $table->index(['service_desk_category_id', 'service_desk_level_id'], 'service_desk_team_cat_level_idx');
            $table->index('user_id', 'service_desk_team_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_desk_team_assignments');
        Schema::dropIfExists('service_desk_categories');
        Schema::dropIfExists('service_desk_levels');
    }
};
