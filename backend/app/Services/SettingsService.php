<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use App\Support\AuthenticationMode;
use App\Support\AuthenticationRoleMappingSettings;
use App\Support\DashboardWidgets;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SettingsService
{
    public function get(string $key, mixed $default = null): mixed
    {
        $setting = Setting::query()->where('key', $key)->first();

        if ($key === AuthenticationMode::KEY) {
            return AuthenticationMode::normalize($setting?->castValue() ?? $default);
        }

        if ($key === AuthenticationRoleMappingSettings::KEY) {
            if ($setting === null) {
                $setting = $this->createAuthenticationRoleMappingSetting();
            }

            return AuthenticationRoleMappingSettings::normalize($setting->castValue());
        }

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

        $values = $query->get()
            ->mapWithKeys(static fn (Setting $setting): array => [$setting->key => $setting->castValue()])
            ->all();

        if ($keys === [] || in_array(AuthenticationRoleMappingSettings::KEY, $keys, true)) {
            $values[AuthenticationRoleMappingSettings::KEY] = AuthenticationRoleMappingSettings::normalize(
                $values[AuthenticationRoleMappingSettings::KEY] ?? null,
            );
        }

        if ($keys === [] || in_array(AuthenticationMode::KEY, $keys, true)) {
            $values[AuthenticationMode::KEY] = AuthenticationMode::normalize(
                $values[AuthenticationMode::KEY] ?? null,
            );
        }

        return $values;
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
    public function publicSettings(): array
    {
        $settings = Setting::query()
            ->where('is_public', true)
            ->get()
            ->mapWithKeys(static fn (Setting $setting): array => [$setting->key => $setting->castValue()])
            ->all();

        $settings[DashboardWidgets::SETTING_KEY] = DashboardWidgets::normalize(
            $settings[DashboardWidgets::SETTING_KEY] ?? null
        );
        $settings[AuthenticationMode::KEY] = AuthenticationMode::normalize(
            $settings[AuthenticationMode::KEY] ?? null,
        );

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
                $setting = Setting::query()->where('key', $key)->first();

                if ($setting === null && $key === DashboardWidgets::SETTING_KEY) {
                    $setting = Setting::query()->create([
                        'key' => DashboardWidgets::SETTING_KEY,
                        'value' => $this->stringifyValue(DashboardWidgets::defaults(), 'json'),
                        'type' => 'json',
                        'group' => 'dashboard',
                        'label' => 'Dashboard Widgets Visibility',
                        'is_public' => true,
                    ]);
                }

                if ($setting === null && $key === AuthenticationRoleMappingSettings::KEY) {
                    $setting = $this->createAuthenticationRoleMappingSetting();
                }

                if ($setting === null && $key === AuthenticationMode::KEY) {
                    $setting = Setting::query()->create([
                        'key' => AuthenticationMode::KEY,
                        'value' => AuthenticationMode::defaults(),
                        'type' => 'string',
                        'group' => 'authentication',
                        'label' => 'Authentication Mode',
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

    private function stringifyValue(mixed $value, string $type): ?string
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            default => (string) $value,
        };
    }

    private function createAuthenticationRoleMappingSetting(): Setting
    {
        return Setting::query()->firstOrCreate(
            ['key' => AuthenticationRoleMappingSettings::KEY],
            [
                'value' => $this->stringifyValue(AuthenticationRoleMappingSettings::defaults(), 'json'),
                'type' => 'json',
                'group' => 'authentication',
                'label' => 'External Authentication Role Mapping',
                'is_public' => false,
            ],
        );
    }
}
