<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Org-wide dashboard widget presentation / grid layout (not role visibility, not per-user order).
 *
 * Stored setting shape:
 * {
 *   "default_order": ["top_technologies", ...],
 *   "widgets": {
 *     "top_technologies": {
 *       "span_desktop": 3,
 *       "span_tablet": 1,
 *       "span_mobile": 1,
 *       "min_height_px": 280,
 *       "max_height_px": null,
 *       "chart_height_px": 240,
 *       "overflow": "auto",
 *       "show_header": true,
 *       "show_description": true,
 *       "show_legend": true,
 *       "show_filters": true,
 *       "show_statistics": true,
 *       "legend_position": "bottom"
 *     }
 *   }
 * }
 *
 * @phpstan-type WidgetLayout array{
 *   span_desktop: int,
 *   span_tablet: int,
 *   span_mobile: int,
 *   min_height_px: int,
 *   max_height_px: int|null,
 *   chart_height_px: int,
 *   overflow: string,
 *   show_header: bool,
 *   show_description: bool,
 *   show_legend: bool,
 *   show_filters: bool,
 *   show_statistics: bool,
 *   legend_position: string
 * }
 * @phpstan-type LayoutConfig array{default_order: list<string>, widgets: array<string, WidgetLayout>}
 */
final class DashboardWidgetLayout
{
    public const string SETTING_KEY = 'dashboard_widget_layout';

    /** @return list<int> */
    public static function allowedDesktopSpans(): array
    {
        return [1, 2, 3, 4, 5, 6];
    }

    /** @return list<int> */
    public static function allowedTabletSpans(): array
    {
        return [1, 2];
    }

    /** @return list<string> */
    public static function allowedOverflows(): array
    {
        return ['auto', 'hidden', 'visible'];
    }

    /** @return list<string> */
    public static function allowedLegendPositions(): array
    {
        return ['bottom', 'top', 'hidden'];
    }

    /**
     * Current production defaults (matches the previous hardcoded frontend spans).
     *
     * @return LayoutConfig
     */
    public static function defaults(): array
    {
        $spans = [
            'top_technologies' => 3,
            'employees_per_application' => 3,
            'applications_by_status' => 2,
            'applications_by_department' => 2,
            'applications_by_ha_model' => 2,
            'license_usage' => 2,
            'infra_license_usage' => 2,
            'service_desk_license_usage' => 2,
            'license_status_distribution' => 2,
            'licenses_by_environment' => 2,
            'recent_activity' => 2,
            'weather' => 6,
            'local_time' => 6,
            'prayer_times' => 6,
        ];

        $widgets = [];
        foreach (DashboardWidgets::keys() as $key) {
            $span = $spans[$key] ?? 3;
            $widgets[$key] = self::baseWidget($span);
        }

        return [
            'default_order' => DashboardWidgets::keys(),
            'widgets' => $widgets,
        ];
    }

    /**
     * Curated recommended layout (balanced thirds on the board, full-width header widgets).
     *
     * @return LayoutConfig
     */
    public static function recommended(): array
    {
        $config = self::defaults();

        $recommendedSpans = [
            'top_technologies' => 3,
            'employees_per_application' => 3,
            'applications_by_status' => 2,
            'applications_by_department' => 2,
            'applications_by_ha_model' => 2,
            'license_usage' => 2,
            'infra_license_usage' => 2,
            'service_desk_license_usage' => 2,
            'license_status_distribution' => 2,
            'licenses_by_environment' => 2,
            'recent_activity' => 3,
            'weather' => 6,
            'local_time' => 6,
            'prayer_times' => 6,
        ];

        $recommendedOrder = [
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

        foreach ($recommendedSpans as $key => $span) {
            if (isset($config['widgets'][$key])) {
                $config['widgets'][$key]['span_desktop'] = $span;
                $config['widgets'][$key]['span_tablet'] = $span >= 6 ? 2 : 1;
            }
        }

        $config['default_order'] = self::normalizeOrder($recommendedOrder);

        return $config;
    }

    /**
     * @param  mixed  $value
     * @return LayoutConfig
     */
    public static function normalize(mixed $value): array
    {
        $defaults = self::defaults();

        if (! is_array($value)) {
            return $defaults;
        }

        $order = self::normalizeOrder($value['default_order'] ?? $defaults['default_order']);

        $incomingWidgets = is_array($value['widgets'] ?? null) ? $value['widgets'] : [];
        $widgets = [];

        foreach (DashboardWidgets::keys() as $key) {
            $base = $defaults['widgets'][$key];
            $raw = is_array($incomingWidgets[$key] ?? null) ? $incomingWidgets[$key] : [];
            $widgets[$key] = self::normalizeWidget($raw, $base);
        }

        return [
            'default_order' => $order,
            'widgets' => $widgets,
        ];
    }

    /**
     * @param  mixed  $order
     * @return list<string>
     */
    public static function normalizeOrder(mixed $order): array
    {
        $known = DashboardWidgets::keys();
        $normalized = [];

        if (is_array($order)) {
            foreach ($order as $key) {
                if (! is_string($key) || ! in_array($key, $known, true)) {
                    continue;
                }
                if (! in_array($key, $normalized, true)) {
                    $normalized[] = $key;
                }
            }
        }

        foreach ($known as $key) {
            if (! in_array($key, $normalized, true)) {
                $normalized[] = $key;
            }
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @param  WidgetLayout  $base
     * @return WidgetLayout
     */
    public static function normalizeWidget(array $raw, array $base): array
    {
        $spanDesktop = self::clampInt(
            $raw['span_desktop'] ?? $base['span_desktop'],
            self::allowedDesktopSpans(),
            $base['span_desktop'],
        );
        $spanTablet = self::clampInt(
            $raw['span_tablet'] ?? $base['span_tablet'],
            self::allowedTabletSpans(),
            $base['span_tablet'],
        );
        $spanMobile = self::clampInt(
            $raw['span_mobile'] ?? $base['span_mobile'],
            [1],
            1,
        );

        $minHeight = self::boundedInt($raw['min_height_px'] ?? $base['min_height_px'], 160, 800, $base['min_height_px']);
        $chartHeight = self::boundedInt($raw['chart_height_px'] ?? $base['chart_height_px'], 120, 640, $base['chart_height_px']);

        $maxHeight = $raw['max_height_px'] ?? $base['max_height_px'];
        if ($maxHeight === null || $maxHeight === '' || $maxHeight === 0 || $maxHeight === '0') {
            $maxHeight = null;
        } else {
            $maxHeight = self::boundedInt($maxHeight, $minHeight, 1600, max($minHeight, 480));
        }

        $overflow = is_string($raw['overflow'] ?? null) && in_array($raw['overflow'], self::allowedOverflows(), true)
            ? $raw['overflow']
            : $base['overflow'];

        $legendPosition = is_string($raw['legend_position'] ?? null) && in_array($raw['legend_position'], self::allowedLegendPositions(), true)
            ? $raw['legend_position']
            : $base['legend_position'];

        return [
            'span_desktop' => $spanDesktop,
            'span_tablet' => $spanTablet,
            'span_mobile' => $spanMobile,
            'min_height_px' => $minHeight,
            'max_height_px' => $maxHeight,
            'chart_height_px' => $chartHeight,
            'overflow' => $overflow,
            'show_header' => array_key_exists('show_header', $raw) ? (bool) $raw['show_header'] : $base['show_header'],
            'show_description' => array_key_exists('show_description', $raw) ? (bool) $raw['show_description'] : $base['show_description'],
            'show_legend' => array_key_exists('show_legend', $raw) ? (bool) $raw['show_legend'] : $base['show_legend'],
            'show_filters' => array_key_exists('show_filters', $raw) ? (bool) $raw['show_filters'] : $base['show_filters'],
            'show_statistics' => array_key_exists('show_statistics', $raw) ? (bool) $raw['show_statistics'] : $base['show_statistics'],
            'legend_position' => $legendPosition,
        ];
    }

    /**
     * @return WidgetLayout
     */
    private static function baseWidget(int $spanDesktop): array
    {
        return [
            'span_desktop' => $spanDesktop,
            'span_tablet' => $spanDesktop >= 6 ? 2 : 1,
            'span_mobile' => 1,
            'min_height_px' => 280,
            'max_height_px' => null,
            'chart_height_px' => 240,
            'overflow' => 'auto',
            'show_header' => true,
            'show_description' => true,
            'show_legend' => true,
            'show_filters' => true,
            'show_statistics' => true,
            'legend_position' => 'bottom',
        ];
    }

    /**
     * @param  mixed  $value
     * @param  list<int>  $allowed
     */
    private static function clampInt(mixed $value, array $allowed, int $fallback): int
    {
        $int = is_numeric($value) ? (int) $value : $fallback;

        return in_array($int, $allowed, true) ? $int : $fallback;
    }

    private static function boundedInt(mixed $value, int $min, int $max, int $fallback): int
    {
        if (! is_numeric($value)) {
            return $fallback;
        }

        $int = (int) $value;

        return max($min, min($max, $int));
    }
}
