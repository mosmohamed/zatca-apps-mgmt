<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('identity_provider_id')->nullable()->after('id')
                ->constrained()->nullOnDelete();
            $table->string('external_subject')->nullable()->after('identity_provider_id');
            $table->string('username')->nullable()->after('email')->index();
            $table->string('employee_id')->nullable()->after('username')->index();
            $table->foreignId('department_id')->nullable()->after('vendor_id')
                ->constrained()->nullOnDelete();
            $table->text('profile_picture_url')->nullable()->after('department_id');
            $table->timestamp('last_sso_login_at')->nullable()->after('profile_picture_url')->index();

            $table->unique(
                ['identity_provider_id', 'external_subject'],
                'users_provider_subject_unique'
            );
            $table->index(['identity_provider_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique('users_provider_subject_unique');
            $table->dropIndex(['identity_provider_id', 'is_active']);
            $table->dropForeign(['identity_provider_id']);
            $table->dropForeign(['department_id']);
            $table->dropColumn([
                'identity_provider_id',
                'external_subject',
                'username',
                'employee_id',
                'department_id',
                'profile_picture_url',
                'last_sso_login_at',
            ]);
        });
    }
};
