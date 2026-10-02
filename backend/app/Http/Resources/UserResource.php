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
            'vendor_id' => $this->vendor_id,
            'phone' => $this->phone,
            'teams' => $this->teams,
            'whatsapp' => $this->whatsapp,
            'extension' => $this->extension,
            'job_title_id' => $this->job_title_id,
            'is_active' => $this->is_active,
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'job_title' => new JobTitleResource($this->whenLoaded('jobTitle')),
            'roles' => $this->when(
                $this->relationLoaded('roles'),
                fn () => $this->roles->pluck('name')->values()->all(),
            ),
            'areas' => $this->when(
                $this->relationLoaded('operationalAreas'),
                fn () => $this->areaCodes(),
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
