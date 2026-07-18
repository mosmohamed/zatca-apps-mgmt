<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'authentication_type' => $this->authentication_type,
            'identity_provider_id' => $this->identity_provider_id,
            'username' => $this->username,
            'employee_id' => $this->employee_id,
            'vendor_id' => $this->vendor_id,
            'department_id' => $this->department_id,
            'profile_picture_url' => $this->profile_picture_url,
            'last_sso_login_at' => $this->formatDate($this->last_sso_login_at),
            'phone' => $this->phone,
            'teams' => $this->teams,
            'whatsapp' => $this->whatsapp,
            'extension' => $this->extension,
            'job_title_id' => $this->job_title_id,
            'is_active' => $this->is_active,
            'vendor' => $this->whenLoaded(
                'vendor',
                fn () => $this->vendor === null ? null : new VendorResource($this->vendor),
            ),
            'department' => $this->whenLoaded(
                'department',
                fn () => $this->department === null ? null : new DepartmentResource($this->department),
            ),
            'identity_provider' => $this->whenLoaded(
                'identityProvider',
                fn () => $this->identityProvider === null
                    ? null
                    : new IdentityProviderResource($this->identityProvider),
            ),
            'external_identities' => $this->whenLoaded(
                'externalIdentities',
                fn () => ExternalIdentityResource::collection($this->externalIdentities)->resolve(),
            ),
            'job_title' => $this->whenLoaded(
                'jobTitle',
                fn () => $this->jobTitle === null ? null : new JobTitleResource($this->jobTitle),
            ),
            'roles' => $this->when(
                $this->relationLoaded('roles'),
                fn () => $this->roles->pluck('name')->values()->all(),
            ),
            'permissions' => $this->when(
                $this->canResolvePermissionsWithoutLazyLoading(),
                fn () => $this->resolvedPermissionNames(),
            ),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
            'deleted_at' => $this->formatDate($this->deleted_at),
        ];
    }

    /**
     * Permissions are only exposed when related permission data was eager-loaded
     * (e.g. auth/me). Listing users with `roles` alone must not call Spatie helpers
     * that touch unloaded `permissions` relations.
     */
    private function canResolvePermissionsWithoutLazyLoading(): bool
    {
        if (! $this->relationLoaded('roles')) {
            return false;
        }

        return $this->roles->every(
            static fn ($role): bool => $role->relationLoaded('permissions'),
        );
    }

    /**
     * @return list<string>
     */
    private function resolvedPermissionNames(): array
    {
        $names = $this->roles
            ->flatMap(static fn ($role) => $role->permissions->pluck('name'))
            ->values();

        if ($this->relationLoaded('permissions')) {
            $names = $names->merge($this->permissions->pluck('name'));
        }

        return $names->unique()->sort()->values()->all();
    }
}
