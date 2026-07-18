<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_mapping_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('identity_provider_id')->constrained()->cascadeOnDelete();
            $table->string('claim_name');
            $table->string('external_value');
            $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
            $table->integer('priority')->default(0)->index();
            $table->boolean('enabled')->default(true)->index();
            $table->string('uniqueness_key', 64)->nullable()->unique();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['identity_provider_id', 'enabled', 'priority']);
            $table->index(['identity_provider_id', 'claim_name', 'external_value'], 'role_mapping_lookup');
            $table->index('claim_name');
            $table->index('external_value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_mapping_rules');
    }
};
