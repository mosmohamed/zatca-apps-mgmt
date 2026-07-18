<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('identity_providers', function (Blueprint $table): void {
            $table->timestamp('last_successful_auth_at')->nullable()->after('configuration')->index();
        });
    }

    public function down(): void
    {
        Schema::table('identity_providers', function (Blueprint $table): void {
            $table->dropColumn('last_successful_auth_at');
        });
    }
};
