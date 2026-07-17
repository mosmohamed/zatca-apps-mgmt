<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use App\Support\DashboardWidgets;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

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
}
