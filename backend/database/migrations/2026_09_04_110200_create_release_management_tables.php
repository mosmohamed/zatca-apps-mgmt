<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('release_management_levels', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('note_en')->nullable();
            $table->string('note_ar')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('release_management_categories', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('parent_id', 'rm_cat_parent_fk')
                ->references('id')
                ->on('release_management_categories')
                ->cascadeOnDelete();
        });

        Schema::create('release_management_team_assignments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('release_management_category_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('release_management_level_id');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('release_management_category_id', 'rm_ta_cat_fk')
                ->references('id')
                ->on('release_management_categories')
                ->cascadeOnDelete();
            $table->foreign('release_management_level_id', 'rm_ta_level_fk')
                ->references('id')
                ->on('release_management_levels')
                ->cascadeOnDelete();
            $table->unique(
                ['release_management_category_id', 'user_id', 'release_management_level_id'],
                'uq_rm_team_assignment'
            );
            $table->index(['release_management_category_id', 'release_management_level_id'], 'rm_team_cat_level_idx');
            $table->index('user_id', 'rm_team_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('release_management_team_assignments');
        Schema::dropIfExists('release_management_categories');
        Schema::dropIfExists('release_management_levels');
    }
};
