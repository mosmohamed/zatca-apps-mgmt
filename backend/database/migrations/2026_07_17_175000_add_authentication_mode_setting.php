<?php

declare(strict_types=1);

use App\Support\AuthenticationMode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => AuthenticationMode::KEY],
            [
                'value' => AuthenticationMode::defaults(),
                'type' => 'string',
                'group' => 'authentication',
                'label' => 'Authentication Mode',
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('settings')->where('key', AuthenticationMode::KEY)->delete();
    }
};
