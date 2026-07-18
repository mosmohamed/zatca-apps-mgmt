<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ExternalIdentity;
use App\Models\Department;
use App\Models\ExternalIdentity as ExternalIdentityRecord;
use App\Models\IdentityProvider;
use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExternalIdentityProvisioningService
{
    public function __construct(
        private readonly RoleMappingService $roleMappingService,
        private readonly AuthenticationGateService $authenticationGate,
        private readonly AuthenticationAuditService $authenticationAudit,
    ) {}

    public function provision(
        IdentityProvider $provider,
        ExternalIdentity $identity,
        ?Request $request = null,
    ): User {
        return DB::transaction(function () use ($provider, $identity, $request): User {
            $settings = $this->roleMappingService->settings();
            $attributes = $this->mappedAttributes($provider, $identity, $settings);
            $email = $attributes['email'] ?? null;

            $identityRecord = ExternalIdentityRecord::query()
                ->with('user')
                ->where('identity_provider_id', $provider->id)
                ->where('external_subject', $identity->subject)
                ->first();
            $user = $identityRecord?->user;

            // Account linking is never performed by email match during SSO login.
            // Users must explicitly initiate linking while authenticated.

            $isNew = $user === null;
            if ($isNew && ! $settings['auto_provisioning']) {
                throw ValidationException::withMessages(['email' => [__('messages.sso.provisioning_disabled')]]);
            }

            if (
                $isNew
                && is_string($email)
                && $email !== ''
                && User::query()->where('email', $email)->exists()
            ) {
                throw ValidationException::withMessages([
                    'email' => [__('messages.sso.email_belongs_to_existing_account')],
                ]);
            }

            if ($isNew) {
                $this->assertRequiredAttributes($attributes);
                $user = User::query()->create(array_merge($attributes, [
                    'identity_provider_id' => $provider->id,
                    'external_subject' => $identity->subject,
                    'password' => Str::random(64),
                    'authentication_type' => 'sso',
                    'is_active' => (bool) $settings['default_user_status'],
                    'last_sso_login_at' => now(),
                ]));
            } else {
                $changes = [
                    'identity_provider_id' => $provider->id,
                    'external_subject' => $identity->subject,
                    'last_sso_login_at' => now(),
                ];
                if ($settings['update_user_information_on_login']) {
                    $changes = array_merge(
                        $changes,
                        $this->filterSyncFields($attributes, (array) $settings['sync_fields']),
                    );
                }
                $user->update($changes);
            }

            ExternalIdentityRecord::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'identity_provider_id' => $provider->id,
                ],
                [
                    'external_subject' => $identity->subject,
                    'external_email' => is_string($email) && $email !== '' ? $email : null,
                    'last_login_at' => now(),
                ],
            );

            $this->authenticationGate->assertUserMayUseSso($user);

            $previousRoles = $user->roles()->pluck('name')->sort()->values()->all();
            $mapping = $this->roleMappingService->resolve($provider, $identity);

            if (
                $settings['enabled']
                && ($isNew || $settings['update_roles_on_login'])
                && ($isNew || $mapping->roles->isNotEmpty())
            ) {
                $user->syncRoles($mapping->roles);
            }

            $newRoles = $user->roles()->pluck('name')->sort()->values()->all();
            $extra = [
                'previous_roles' => $previousRoles,
                'new_roles' => $newRoles,
                'mapping_rules' => $mapping->ruleIds,
                'external_subject' => $identity->subject,
                'performed_by' => 'system',
            ];

            if ($isNew) {
                $this->authenticationAudit->userProvisioned($user, $provider, $request, $extra);
            } else {
                $this->authenticationAudit->userSynchronized($user, $provider, $request, $extra);
            }

            if ($previousRoles !== $newRoles) {
                $this->authenticationAudit->rolesSynchronized($user, $provider, $request, $extra);
            }

            if (! $user->is_active) {
                throw ValidationException::withMessages(['email' => [__('messages.auth.inactive')]]);
            }

            $provider->forceFill(['last_successful_auth_at' => now()])->save();

            return $user->refresh()->load([
                'vendor',
                'department',
                'externalIdentities',
                'identityProvider',
                'jobTitle',
                'roles.permissions',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    private function mappedAttributes(
        IdentityProvider $provider,
        ExternalIdentity $identity,
        array $settings,
    ): array {
        $mapping = array_replace([
            'first_name' => 'given_name',
            'last_name' => 'family_name',
            'email' => 'email',
            'username' => 'preferred_username',
            'employee_id' => 'employee_id',
            'department' => (string) $settings['department_claim'],
            'job_title' => 'job_title',
            'profile_picture' => 'picture',
        ], (array) ($provider->configuration['claim_mapping'] ?? []));

        $attributes = [];
        foreach ($mapping as $field => $claim) {
            $value = $identity->claim((string) $claim);
            if (is_scalar($value) && trim((string) $value) !== '') {
                $attributes[$field] = trim((string) $value);
            }
        }

        if ($settings['automatic_department_mapping'] && isset($attributes['department'])) {
            $attributes['department_id'] = Department::query()
                ->where(static function (Builder $query) use ($attributes): void {
                    $query->where('name_en', $attributes['department'])
                        ->orWhere('name_ar', $attributes['department']);
                })
                ->value('id');
        }
        unset($attributes['department']);

        if (isset($attributes['job_title'])) {
            $attributes['job_title_id'] = JobTitle::query()
                ->where(static function (Builder $query) use ($attributes): void {
                    $query->where('name_en', $attributes['job_title'])
                        ->orWhere('name_ar', $attributes['job_title']);
                })
                ->value('id');
        }
        unset($attributes['job_title']);

        if (isset($attributes['profile_picture'])) {
            $attributes['profile_picture_url'] = $attributes['profile_picture'];
            unset($attributes['profile_picture']);
        }

        return $attributes;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<string, mixed>  $sync
     * @return array<string, mixed>
     */
    private function filterSyncFields(array $attributes, array $sync): array
    {
        $columns = [
            'first_name' => 'first_name',
            'last_name' => 'last_name',
            'email' => 'email',
            'username' => 'username',
            'employee_id' => 'employee_id',
            'department' => 'department_id',
            'job_title' => 'job_title_id',
            'profile_picture' => 'profile_picture_url',
        ];

        return array_filter(
            $attributes,
            static fn (string $column): bool => (bool) ($sync[array_search($column, $columns, true)] ?? false),
            ARRAY_FILTER_USE_KEY,
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function assertRequiredAttributes(array $attributes): void
    {
        foreach (['first_name', 'last_name', 'email'] as $field) {
            if (empty($attributes[$field])) {
                throw ValidationException::withMessages([
                    $field => [__('messages.sso.missing_claim', ['claim' => $field])],
                ]);
            }
        }
    }
}
