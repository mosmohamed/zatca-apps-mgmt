<?php

declare(strict_types=1);

namespace App\Http\Requests\ServiceDeskTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateServiceDeskTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ServiceDeskTeamAssignment $infraTeamAssignment */
        $infraTeamAssignment = $this->route('infra_team_assignment');

        return $this->user()?->can('update', $infraTeamAssignment) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'service_desk_category_id' => ['sometimes', 'required', 'integer', Rule::exists('service_desk_categories', 'id')],
            'user_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'id')],
            'service_desk_level_id' => ['sometimes', 'required', 'integer', Rule::exists('service_desk_levels', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var ServiceDeskTeamAssignment|null $assignment */
            $assignment = $this->route('infra_team_assignment');
            if (! $assignment instanceof ServiceDeskTeamAssignment) {
                return;
            }

            $categoryId = (int) $this->input('service_desk_category_id', $assignment->service_desk_category_id);
            $userId = (int) $this->input('user_id', $assignment->user_id);
            $levelId = (int) $this->input('service_desk_level_id', $assignment->service_desk_level_id);

            $hasChildren = ServiceDeskCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'service_desk_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );

                return;
            }

            $exists = ServiceDeskTeamAssignment::query()
                ->where('service_desk_category_id', $categoryId)
                ->where('user_id', $userId)
                ->where('service_desk_level_id', $levelId)
                ->whereKeyNot($assignment->id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('service_desk_category_id', __('messages.validation.unique'));
            }
        });
    }
}
