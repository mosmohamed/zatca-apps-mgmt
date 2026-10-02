<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smart_facilities_levels', function (Blueprint $table): void {
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

        Schema::create('smart_facilities_categories', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('parent_id', 'sf_cat_parent_fk')
                ->references('id')
                ->on('smart_facilities_categories')
                ->cascadeOnDelete();
        });

        Schema::create('smart_facilities_team_assignments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('smart_facilities_category_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('smart_facilities_level_id');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('smart_facilities_category_id', 'sf_ta_cat_fk')
                ->references('id')
                ->on('smart_facilities_categories')
                ->cascadeOnDelete();
            $table->foreign('smart_facilities_level_id', 'sf_ta_level_fk')
                ->references('id')
                ->on('smart_facilities_levels')
                ->cascadeOnDelete();
            $table->unique(
                ['smart_facilities_category_id', 'user_id', 'smart_facilities_level_id'],
                'uq_sf_team_assignment'
            );
            $table->index(['smart_facilities_category_id', 'smart_facilities_level_id'], 'sf_team_cat_level_idx');
            $table->index('user_id', 'sf_team_user_idx');
        });

        Schema::create('smart_facilities_licenses', function (Blueprint $table): void {
            $table->id();
            $table->string('publisher')->index();
            $table->string('name')->index();
            $table->string('product')->index();
            $table->string('version')->nullable();
            $table->text('description')->nullable();
            $table->string('environment')->index();
            // unsignedInteger maps to signed INT on SQL Server (no UNSIGNED type).
            // Non-negative values are enforced by application validation rules.
            $table->unsignedInteger('licensed')->default(0);
            $table->unsignedInteger('used')->default(0);
            $table->unsignedInteger('available')->default(0);
            $table->string('proof_of_entitlement', 2048)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['publisher', 'name', 'product'], 'smart_facilities_licenses_searchable_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smart_facilities_licenses');
        Schema::dropIfExists('smart_facilities_team_assignments');
        Schema::dropIfExists('smart_facilities_categories');
        Schema::dropIfExists('smart_facilities_levels');
    }
};
