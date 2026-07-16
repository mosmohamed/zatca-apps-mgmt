<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_roles', function (Blueprint $table): void {
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->integer('sort_order')->default(0)->index();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('app_roles', function (Blueprint $table): void {
            $table->dropSoftDeletes();
            $table->dropColumn(['description', 'is_active', 'sort_order']);
        });
    }
};
