<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Canonical dashboard widget identifiers used by settings and the dashboard UI.
 *
 * Add new widgets here first so Settings and Dashboard stay in sync.
 *
 * @phpstan-type WidgetMap array<string, bool>
 */
final class DashboardWidgets
{
    public const string SETTING_KEY = 'dashboard_widgets';

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
            'license_status_distribution',
            'licenses_by_environment',
            'recent_activity',
        ];
    }

    /**
     * @return WidgetMap
     */
    public static function defaults(): array
    {
        $defaults = [];

        foreach (self::keys() as $key) {
            $defaults[$key] = true;
        }

        return $defaults;
    }

    /**
     * @return WidgetMap
     */
    public static function normalize(mixed $value): array
    {
        $defaults = self::defaults();

        if (! is_array($value)) {
            return $defaults;
        }

        foreach (self::keys() as $key) {
            if (array_key_exists($key, $value)) {
                $defaults[$key] = (bool) $value[$key];
            }
        }

        return $defaults;
    }
}
