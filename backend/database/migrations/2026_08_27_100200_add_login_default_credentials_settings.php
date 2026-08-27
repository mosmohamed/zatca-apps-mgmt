<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * @var list<array{key: string, value: string, type: string, label: string}>
     */
    private const array SETTINGS = [
        [
            'key' => 'login_default_credentials_enabled',
            'value' => '1',
            'type' => 'boolean',
            'label' => 'Show Default Login Credentials',
        ],
        [
            'key' => 'login_default_email',
            'value' => 'viewer@zatca.gov.sa',
            'type' => 'string',
            'label' => 'Default Login Email',
        ],
        [
            'key' => 'login_default_password',
            'value' => 'password',
            'type' => 'string',
            'label' => 'Default Login Password',
        ],
    ];

    public function up(): void
    {
        $now = now();

        foreach (self::SETTINGS as $setting) {
            $exists = DB::table('settings')->where('key', $setting['key'])->exists();

            if ($exists) {
                continue;
            }

            DB::table('settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'type' => $setting['type'],
                'group' => 'security',
                'label' => $setting['label'],
                'is_public' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')
            ->whereIn('key', array_column(self::SETTINGS, 'key'))
            ->delete();
    }
};
