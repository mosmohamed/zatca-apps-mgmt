<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Application
 */
class ApplicationResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'department_id' => $this->department_id,
            'application_type_id' => $this->application_type_id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'code' => $this->code,
            'description' => $this->description,
            'technical_category' => $this->technical_category,
            'status_id' => $this->status_id,
            'criticality_id' => $this->criticality_id,
            'support_type_id' => $this->support_type_id,
            'vendor_id' => $this->vendor_id,
            'ha_model' => $this->ha_model?->value,
            'documentation_url' => $this->documentation_url,
            'repository_url' => $this->repository_url,
            'remarks' => $this->remarks,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'application_type' => new ApplicationTypeResource($this->whenLoaded('applicationType')),
            'status' => new ApplicationStatusResource($this->whenLoaded('status')),
            'criticality' => new CriticalityResource($this->whenLoaded('criticality')),
            'support_type' => new SupportTypeResource($this->whenLoaded('supportType')),
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'technologies' => TechnologyResource::collection($this->whenLoaded('technologies')),
            'business_owners' => ApplicationOwnerResource::collection($this->whenLoaded('businessOwners')),
            'technical_owners' => ApplicationOwnerResource::collection($this->whenLoaded('technicalOwners')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
            'assignments' => ApplicationAssignmentResource::collection($this->whenLoaded('assignments')),
            'can_view_infrastructure' => $this->canViewInfrastructure($request),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
            'deleted_at' => $this->formatDate($this->deleted_at),
        ];
    }

    private function canViewInfrastructure(Request $request): bool
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return false;
        }

        /** @var Application $application */
        $application = $this->resource;

        return $user->can('viewInfrastructure', $application);
    }
}
