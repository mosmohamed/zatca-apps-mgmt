<?php

declare(strict_types=1);

namespace App\Http\Requests\ReleaseManagementTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ReleaseManagementCategory;
use App\Models\ReleaseManagementTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateReleaseManagementTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ReleaseManagementTeamAssignment $infraTeamAssignment */
        $infraTeamAssignment = $this->route('infra_team_assignment');

        return $this->user()?->can('update', $infraTeamAssignment) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'release_management_category_id' => ['sometimes', 'required', 'integer', Rule::exists('release_management_categories', 'id')],
            'user_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'id')],
            'release_management_level_id' => ['sometimes', 'required', 'integer', Rule::exists('release_management_levels', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var ReleaseManagementTeamAssignment|null $assignment */
            $assignment = $this->route('infra_team_assignment');
            if (! $assignment instanceof ReleaseManagementTeamAssignment) {
                return;
            }

            $categoryId = (int) $this->input('release_management_category_id', $assignment->release_management_category_id);
            $userId = (int) $this->input('user_id', $assignment->user_id);
            $levelId = (int) $this->input('release_management_level_id', $assignment->release_management_level_id);

            $hasChildren = ReleaseManagementCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'release_management_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );

                return;
            }

            $exists = ReleaseManagementTeamAssignment::query()
                ->where('release_management_category_id', $categoryId)
                ->where('user_id', $userId)
                ->where('release_management_level_id', $levelId)
                ->whereKeyNot($assignment->id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('release_management_category_id', __('messages.validation.unique'));
            }
        });
    }
}
