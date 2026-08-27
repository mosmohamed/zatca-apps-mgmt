<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_desk_licenses', function (Blueprint $table): void {
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

            $table->index(['publisher', 'name', 'product'], 'service_desk_licenses_searchable_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_desk_licenses');
    }
};
