<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Support\DashboardWidgetLayout;
use App\Support\DashboardWidgets;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class SettingsService
{
    public function get(string $key, mixed $default = null): mixed
    {
        $setting = Setting::query()->where('key', $key)->first();

        return $setting?->castValue() ?? $default;
    }

    /**
     * @param  list<string>  $keys
     * @return array<string, mixed>
     */
    public function getMany(array $keys = []): array
    {
        $query = Setting::query();

        if ($keys !== []) {
            $query->whereIn('key', $keys);
        }

        return $query->get()
            ->mapWithKeys(static fn (Setting $setting): array => [$setting->key => $setting->castValue()])
            ->all();
    }

    /**
     * @return Collection<int, Setting>
     */
    public function all(): Collection
    {
        return Setting::query()->orderBy('group')->orderBy('key')->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function publicSettings(?User $user = null): array
    {
        $user ??= Auth::guard('sanctum')->user();

        $settings = Setting::query()
            ->where('is_public', true)
            ->get()
            ->mapWithKeys(static fn (Setting $setting): array => [$setting->key => $setting->castValue()])
            ->all();

        $stored = $settings[DashboardWidgets::SETTING_KEY] ?? null;
        $config = DashboardWidgets::normalizeConfig($stored);

        $settings[DashboardWidgets::SETTING_KEY] = DashboardWidgets::forUser(
            $user instanceof User ? $user->loadMissing('roles') : null,
            $config,
        );

        $settings[DashboardWidgetLayout::SETTING_KEY] = DashboardWidgetLayout::normalize(
            $settings[DashboardWidgetLayout::SETTING_KEY] ?? null,
        );

        if ($user instanceof User && $user->can('settings.update')) {
            $settings['dashboard_widgets_by_role'] = $config['roles'];
            $settings['dashboard_widget_roles'] = Role::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(static fn (Role $role): array => [
                    'id' => (int) $role->id,
                    'name' => (string) $role->name,
                ])
                ->values()
                ->all();
        }

        return $settings;
    }

    /**
     * @param  array<string, mixed>  $values
     * @return Collection<int, Setting>
     */
    public function setMany(array $values): Collection
    {
        return DB::transaction(function () use ($values): Collection {
            foreach ($values as $key => $value) {
                if ($key === DashboardWidgets::SETTING_KEY) {
                    $value = $this->normalizeIncomingDashboardWidgets($value);
                }

                if ($key === DashboardWidgetLayout::SETTING_KEY) {
                    $value = DashboardWidgetLayout::normalize($value);
                }

                $setting = Setting::query()->where('key', $key)->first();

                if ($setting === null && $key === DashboardWidgets::SETTING_KEY) {
                    $setting = Setting::query()->create([
                        'key' => DashboardWidgets::SETTING_KEY,
                        'value' => $this->stringifyValue(
                            DashboardWidgets::normalizeConfig(null),
                            'json',
                        ),
                        'type' => 'json',
                        'group' => 'dashboard',
                        'label' => 'Dashboard Widgets Visibility',
                        'is_public' => true,
                    ]);
                }

                if ($setting === null && $key === DashboardWidgetLayout::SETTING_KEY) {
                    $setting = Setting::query()->create([
                        'key' => DashboardWidgetLayout::SETTING_KEY,
                        'value' => $this->stringifyValue(
                            DashboardWidgetLayout::defaults(),
                            'json',
                        ),
                        'type' => 'json',
                        'group' => 'dashboard',
                        'label' => 'Dashboard Widget Layout',
                        'is_public' => true,
                    ]);
                }

                if ($setting === null) {
                    continue;
                }

                $setting->update([
                    'value' => $this->stringifyValue($value, $setting->type),
                ]);
            }

            return Setting::query()->whereIn('key', array_keys($values))->get();
        });
    }

    public function ensureRoleDashboardWidgets(int $roleId): void
    {
        $raw = $this->get(DashboardWidgets::SETTING_KEY);
        $rolesPayload = is_array($raw) && is_array($raw['roles'] ?? null)
            ? $raw['roles']
            : [];

        $key = (string) $roleId;
        if (array_key_exists($key, $rolesPayload) || array_key_exists($roleId, $rolesPayload)) {
            return;
        }

        $config = DashboardWidgets::normalizeConfig($raw);
        $config['roles'][$key] = DashboardWidgets::defaults();
        $this->persistDashboardWidgetsConfig($config);
    }

    public function removeRoleDashboardWidgets(int $roleId): void
    {
        $config = DashboardWidgets::normalizeConfig(
            $this->get(DashboardWidgets::SETTING_KEY)
        );

        $key = (string) $roleId;
        if (! array_key_exists($key, $config['roles'])) {
            return;
        }

        unset($config['roles'][$key]);
        $this->persistDashboardWidgetsConfig($config);
    }

    /**
     * @param  mixed  $value
     * @return array{roles: array<string, array<string, bool>>}
     */
    private function normalizeIncomingDashboardWidgets(mixed $value): array
    {
        $current = DashboardWidgets::normalizeConfig(
            $this->get(DashboardWidgets::SETTING_KEY)
        );

        if (! is_array($value)) {
            return $current;
        }

        if (DashboardWidgets::isLegacyFlatMap($value)) {
            return DashboardWidgets::normalizeConfig($value);
        }

        if (! array_key_exists('roles', $value) || ! is_array($value['roles'])) {
            return $current;
        }

        $roles = $current['roles'];
        foreach ($value['roles'] as $roleId => $map) {
            $roles[(string) $roleId] = DashboardWidgets::normalizeRoleMap($map);
        }

        return DashboardWidgets::normalizeConfig(['roles' => $roles]);
    }

    /**
     * @param  array{roles: array<string, array<string, bool>>}  $config
     */
    private function persistDashboardWidgetsConfig(array $config): void
    {
        $setting = Setting::query()->where('key', DashboardWidgets::SETTING_KEY)->first();

        if ($setting === null) {
            Setting::query()->create([
                'key' => DashboardWidgets::SETTING_KEY,
                'value' => $this->stringifyValue($config, 'json'),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widgets Visibility',
                'is_public' => true,
            ]);

            return;
        }

        $setting->update([
            'value' => $this->stringifyValue($config, 'json'),
        ]);
    }

    private function stringifyValue(mixed $value, string $type): ?string
    {
        if ($value === null) {
            return match ($type) {
                'string' => '',
                default => null,
            };
        }

        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            default => (string) $value,
        };
    }
}
