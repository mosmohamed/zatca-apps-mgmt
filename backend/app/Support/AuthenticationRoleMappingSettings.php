<?php

declare(strict_types=1);

namespace App\Support;

final class AuthenticationRoleMappingSettings
{
    public const string KEY = 'authentication_role_mapping';

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'enabled' => true,
            'auto_provisioning' => true,
            'allow_email_account_linking' => false,
            'require_verified_email_for_linking' => true,
            'automatic_department_mapping' => false,
            'department_claim' => 'department',
            'default_role_id' => null,
            'default_user_status' => true,
            'update_roles_on_login' => true,
            'update_user_information_on_login' => true,
            'multi_match_strategy' => 'multiple',
            'sync_fields' => [
                'first_name' => true,
                'last_name' => true,
                'email' => true,
                'username' => true,
                'employee_id' => true,
                'department' => true,
                'job_title' => true,
                'profile_picture' => true,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function normalize(mixed $value): array
    {
        $value = is_array($value) ? $value : [];
        $syncFields = is_array($value['sync_fields'] ?? null) ? $value['sync_fields'] : [];

        return array_replace(
            self::defaults(),
            $value,
            ['sync_fields' => array_replace(self::defaults()['sync_fields'], $syncFields)],
        );
    }
}
