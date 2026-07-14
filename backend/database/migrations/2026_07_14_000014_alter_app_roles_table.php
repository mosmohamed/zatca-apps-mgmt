<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_roles', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->boolean('is_active')->default(true)->index()->after('description');
            $table->integer('sort_order')->default(0)->index()->after('is_active');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('app_roles', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['description', 'is_active', 'sort_order']);
        });
    }
};
