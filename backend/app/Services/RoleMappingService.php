<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ExternalIdentity;
use App\Data\RoleMappingResult;
use App\Models\IdentityProvider;
use App\Models\RoleMappingRule;
use App\Models\Setting;
use App\Support\AuthenticationRoleMappingSettings;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

class RoleMappingService
{
    /**
     * @return array<string, mixed>
     */
    public function settings(): array
    {
        $setting = Setting::query()->firstOrCreate(
            ['key' => AuthenticationRoleMappingSettings::KEY],
            [
                'value' => json_encode(AuthenticationRoleMappingSettings::defaults(), JSON_UNESCAPED_SLASHES),
                'type' => 'json',
                'group' => 'authentication',
                'label' => 'External Authentication Role Mapping',
                'is_public' => false,
            ],
        );

        return AuthenticationRoleMappingSettings::normalize($setting->castValue());
    }

    public function resolve(IdentityProvider $provider, ExternalIdentity $identity): RoleMappingResult
    {
        $settings = $this->settings();

        if (! $settings['enabled']) {
            return new RoleMappingResult(collect(), []);
        }

        $rules = RoleMappingRule::query()
            ->with('role')
            ->where('identity_provider_id', $provider->id)
            ->where('enabled', true)
            ->orderByDesc('priority')
            ->orderBy('id')
            ->get();

        $matched = $rules->filter(
            static fn (RoleMappingRule $rule): bool => in_array(
                ExternalIdentity::normalize($rule->external_value),
                $identity->normalizedValues($rule->claim_name),
                true,
            ),
        );

        if ($settings['multi_match_strategy'] === 'highest_priority' && $matched->isNotEmpty()) {
            $highest = $matched->max('priority');
            $matched = $matched->where('priority', $highest);
        }

        /** @var Collection<int, Role> $roles */
        $roles = $matched->pluck('role')->filter()->unique('id')->values();

        if ($roles->isEmpty() && is_numeric($settings['default_role_id'])) {
            $defaultRole = Role::query()
                ->where('guard_name', 'web')
                ->find((int) $settings['default_role_id']);
            if ($defaultRole !== null) {
                $roles = collect([$defaultRole]);
            }
        }

        return new RoleMappingResult(
            $roles,
            $matched->pluck('id')->map(static fn (mixed $id): int => (int) $id)->values()->all(),
        );
    }
}
