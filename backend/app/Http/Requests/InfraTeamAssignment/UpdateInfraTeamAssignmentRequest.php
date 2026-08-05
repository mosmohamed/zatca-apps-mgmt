<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraCategory;
use App\Models\InfraTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateInfraTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var InfraTeamAssignment $infraTeamAssignment */
        $infraTeamAssignment = $this->route('infra_team_assignment');

        return $this->user()?->can('update', $infraTeamAssignment) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'infra_category_id' => ['sometimes', 'required', 'integer', Rule::exists('infra_categories', 'id')],
            'user_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'id')],
            'infra_level_id' => ['sometimes', 'required', 'integer', Rule::exists('infra_levels', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var InfraTeamAssignment|null $assignment */
            $assignment = $this->route('infra_team_assignment');
            if (! $assignment instanceof InfraTeamAssignment) {
                return;
            }

            $categoryId = (int) $this->input('infra_category_id', $assignment->infra_category_id);
            $userId = (int) $this->input('user_id', $assignment->user_id);
            $levelId = (int) $this->input('infra_level_id', $assignment->infra_level_id);

            $hasChildren = InfraCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'infra_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );

                return;
            }

            $exists = InfraTeamAssignment::query()
                ->where('infra_category_id', $categoryId)
                ->where('user_id', $userId)
                ->where('infra_level_id', $levelId)
                ->whereKeyNot($assignment->id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('infra_category_id', __('messages.validation.unique'));
            }
        });
    }
}
