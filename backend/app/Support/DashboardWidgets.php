<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

/**
 * Canonical dashboard widget identifiers and role-scoped visibility config.
 *
 * Stored setting shape:
 * {
 *   "roles": {
 *     "<role_id>": { "top_technologies": true, "weather": false, ... }
 *   }
 * }
 *
 * Legacy flat maps { "top_technologies": true, ... } are still accepted and
 * migrated into the role-scoped structure.
 *
 * @phpstan-type WidgetMap array<string, bool>
 * @phpstan-type RoleWidgetConfig array{roles: array<string, WidgetMap>}
 */
final class DashboardWidgets
{
    public const string SETTING_KEY = 'dashboard_widgets';

    /**
     * Header widgets that are off by default.
     *
     * @return list<string>
     */
    public static function headerKeys(): array
    {
        return [
            'weather',
            'local_time',
            'prayer_times',
        ];
    }

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return [
            'top_technologies',
            'employees_per_application',
            'applications_by_status',
            'applications_by_department',
            'applications_by_ha_model',
            'license_usage',
            'infra_license_usage',
            'service_desk_license_usage',
            'license_status_distribution',
            'licenses_by_environment',
            'recent_activity',
            'weather',
            'local_time',
            'prayer_times',
        ];
    }

    /**
     * @return WidgetMap
     */
    public static function defaults(): array
    {
        $defaults = [];
        $headerKeys = self::headerKeys();

        foreach (self::keys() as $key) {
            $defaults[$key] = ! in_array($key, $headerKeys, true);
        }

        return $defaults;
    }

    /**
     * Normalize a single role's widget visibility map.
     *
     * @param  mixed  $value
     * @return WidgetMap
     */
    public static function normalizeRoleMap(mixed $value): array
    {
        $defaults = self::defaults();

        if (! is_array($value)) {
            return $defaults;
        }

        // Reject nested role-config mistaken for a role map.
        if (array_key_exists('roles', $value) && is_array($value['roles'])) {
            return $defaults;
        }

        foreach (self::keys() as $key) {
            if (array_key_exists($key, $value)) {
                $defaults[$key] = (bool) $value[$key];
            }
        }

        return $defaults;
    }

    /**
     * Normalize the full stored setting (role-scoped or legacy flat).
     *
     * @param  mixed  $value
     * @return RoleWidgetConfig
     */
    public static function normalizeConfig(mixed $value): array
    {
        $roleIds = self::existingRoleIds();

        if (! is_array($value)) {
            return self::configForRoleIds($roleIds, self::defaults());
        }

        // Legacy flat widget map → apply to every role.
        if (self::isLegacyFlatMap($value)) {
            return self::configForRoleIds($roleIds, self::normalizeRoleMap($value));
        }

        $rolesPayload = is_array($value['roles'] ?? null) ? $value['roles'] : [];
        $normalized = ['roles' => []];

        foreach ($roleIds as $roleId) {
            $key = (string) $roleId;
            $normalized['roles'][$key] = self::normalizeRoleMap($rolesPayload[$key] ?? $rolesPayload[$roleId] ?? null);
        }

        // Preserve configs for role IDs present in payload but not currently in DB
        // (e.g. race during role deletion) — skip to avoid orphans.

        return $normalized;
    }

    /**
     * Effective widgets for a user (union across assigned roles).
     *
     * @param  mixed  $config
     * @return WidgetMap
     */
    public static function forUser(?User $user, mixed $config = null): array
    {
        $normalized = self::normalizeConfig($config);
        $defaults = self::defaults();

        if ($user === null) {
            return $defaults;
        }

        $roleIds = $user->roles->pluck('id')->map(static fn ($id): string => (string) $id)->all();

        if ($roleIds === []) {
            return $defaults;
        }

        $effective = [];
        foreach (self::keys() as $key) {
            $effective[$key] = false;
        }

        $matched = false;
        foreach ($roleIds as $roleId) {
            $map = $normalized['roles'][$roleId] ?? null;
            if ($map === null) {
                $map = $defaults;
            } else {
                $matched = true;
            }

            foreach (self::keys() as $key) {
                if (($map[$key] ?? false) === true) {
                    $effective[$key] = true;
                }
            }
        }

        // If none of the user's roles have an explicit entry yet, fall back to defaults.
        if (! $matched) {
            return $defaults;
        }

        return $effective;
    }

    /**
     * @deprecated Use normalizeRoleMap() or normalizeConfig().
     *
     * @param  mixed  $value
     * @return WidgetMap
     */
    public static function normalize(mixed $value): array
    {
        if (is_array($value) && array_key_exists('roles', $value)) {
            return self::defaults();
        }

        return self::normalizeRoleMap($value);
    }

    /**
     * @param  array<string, WidgetMap>  $roles
     * @return RoleWidgetConfig
     */
    public static function wrapRoles(array $roles): array
    {
        return ['roles' => $roles];
    }

    /**
     * @param  array<int|string, mixed>  $value
     */
    public static function isLegacyFlatMap(array $value): bool
    {
        if (array_key_exists('roles', $value)) {
            return false;
        }

        foreach (array_keys($value) as $key) {
            if (! is_string($key) || ! in_array($key, self::keys(), true)) {
                return false;
            }
        }

        return $value !== [];
    }

    /**
     * @return list<int>
     */
    private static function existingRoleIds(): array
    {
        if (! Schema::hasTable(config('permission.table_names.roles', 'roles'))) {
            return [];
        }

        return Role::query()
            ->orderBy('id')
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }

    /**
     * @param  list<int>  $roleIds
     * @param  WidgetMap  $map
     * @return RoleWidgetConfig
     */
    private static function configForRoleIds(array $roleIds, array $map): array
    {
        $roles = [];
        foreach ($roleIds as $roleId) {
            $roles[(string) $roleId] = $map;
        }

        return ['roles' => $roles];
    }
}
