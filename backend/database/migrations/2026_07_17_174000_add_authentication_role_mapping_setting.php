<?php

declare(strict_types=1);

use App\Support\AuthenticationRoleMappingSettings;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => AuthenticationRoleMappingSettings::KEY],
            [
                'value' => json_encode(AuthenticationRoleMappingSettings::defaults(), JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'authentication',
                'label' => 'External Authentication Role Mapping',
                'is_public' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('settings')->where('key', AuthenticationRoleMappingSettings::KEY)->delete();
    }
};
