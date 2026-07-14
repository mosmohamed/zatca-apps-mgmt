<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_technology', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')
                ->constrained('applications')
                ->cascadeOnDelete();
            $table->foreignId('technology_id')
                ->constrained('technologies')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['application_id', 'technology_id']);
            $table->index('technology_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_technology');
    }
};
