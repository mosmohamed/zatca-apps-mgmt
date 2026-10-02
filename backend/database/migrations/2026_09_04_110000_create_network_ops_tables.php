<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('network_ops_levels', function (Blueprint $table): void {
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

        Schema::create('network_ops_categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('network_ops_categories')
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

        Schema::create('network_ops_team_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('network_ops_category_id')
                ->constrained('network_ops_categories')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->noActionOnDelete();
            $table->foreignId('network_ops_level_id')
                ->constrained('network_ops_levels')
                ->noActionOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(
                ['network_ops_category_id', 'user_id', 'network_ops_level_id'],
                'uq_network_ops_team_assignment'
            );
            $table->index(['network_ops_category_id', 'network_ops_level_id'], 'network_ops_team_cat_level_idx');
            $table->index('user_id', 'network_ops_team_user_idx');
        });

        Schema::create('network_ops_licenses', function (Blueprint $table): void {
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

            $table->index(['publisher', 'name', 'product'], 'network_ops_licenses_searchable_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('network_ops_licenses');
        Schema::dropIfExists('network_ops_team_assignments');
        Schema::dropIfExists('network_ops_categories');
        Schema::dropIfExists('network_ops_levels');
    }
};
