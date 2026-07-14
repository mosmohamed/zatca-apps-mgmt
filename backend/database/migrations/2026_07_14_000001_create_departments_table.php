<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->timestamps();
            $table->softDeletes();

            $table->index('name_ar');
            $table->index('name_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
