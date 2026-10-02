<?php

declare(strict_types=1);

namespace App\Http\Requests\SmartFacilitiesTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\SmartFacilitiesCategory;
use App\Models\SmartFacilitiesTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateSmartFacilitiesTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var SmartFacilitiesTeamAssignment $infraTeamAssignment */
        $infraTeamAssignment = $this->route('infra_team_assignment');

        return $this->user()?->can('update', $infraTeamAssignment) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'smart_facilities_category_id' => ['sometimes', 'required', 'integer', Rule::exists('smart_facilities_categories', 'id')],
            'user_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'id')],
            'smart_facilities_level_id' => ['sometimes', 'required', 'integer', Rule::exists('smart_facilities_levels', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var SmartFacilitiesTeamAssignment|null $assignment */
            $assignment = $this->route('infra_team_assignment');
            if (! $assignment instanceof SmartFacilitiesTeamAssignment) {
                return;
            }

            $categoryId = (int) $this->input('smart_facilities_category_id', $assignment->smart_facilities_category_id);
            $userId = (int) $this->input('user_id', $assignment->user_id);
            $levelId = (int) $this->input('smart_facilities_level_id', $assignment->smart_facilities_level_id);

            $hasChildren = SmartFacilitiesCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'smart_facilities_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );

                return;
            }

            $exists = SmartFacilitiesTeamAssignment::query()
                ->where('smart_facilities_category_id', $categoryId)
                ->where('user_id', $userId)
                ->where('smart_facilities_level_id', $levelId)
                ->whereKeyNot($assignment->id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('smart_facilities_category_id', __('messages.validation.unique'));
            }
        });
    }
}
