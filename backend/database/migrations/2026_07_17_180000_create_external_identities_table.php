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
        Schema::create('external_identities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('identity_provider_id')->constrained()->cascadeOnDelete();
            // Immutable IdP identifier: OIDC "sub" claim or SAML NameID (not renamed to external_user_id).
            $table->string('external_subject');
            $table->string('external_email')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['identity_provider_id', 'external_subject'],
                'external_identities_provider_subject_unique',
            );
            $table->unique(
                ['user_id', 'identity_provider_id'],
                'external_identities_user_provider_unique',
            );
            $table->index(['user_id', 'last_login_at']);
            $table->index('external_email');
        });

        $now = now();
        DB::table('users')
            ->whereNotNull('identity_provider_id')
            ->whereNotNull('external_subject')
            ->orderBy('id')
            ->chunkById(500, static function ($users) use ($now): void {
                $rows = [];
                foreach ($users as $user) {
                    $rows[] = [
                        'user_id' => $user->id,
                        'identity_provider_id' => $user->identity_provider_id,
                        'external_subject' => $user->external_subject,
                        'external_email' => $user->email,
                        'last_login_at' => $user->last_sso_login_at,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                DB::table('external_identities')->insertOrIgnore($rows);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_identities');
    }
};
