<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('identity_providers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('protocol', 16)->index();
            $table->boolean('enabled')->default(true)->index();
            $table->longText('configuration');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['enabled', 'protocol']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('identity_providers');
    }
};
