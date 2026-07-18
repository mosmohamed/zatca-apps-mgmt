<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('authentication_type', 20)
                ->default('local')
                ->after('password')
                ->index();
        });

        DB::table('users')
            ->whereNotNull('identity_provider_id')
            ->orWhereNotNull('external_subject')
            ->update(['authentication_type' => 'sso']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['authentication_type']);
            $table->dropColumn('authentication_type');
        });
    }
};
