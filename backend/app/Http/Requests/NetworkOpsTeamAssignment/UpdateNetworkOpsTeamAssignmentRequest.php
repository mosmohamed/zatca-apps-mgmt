<?php

declare(strict_types=1);

namespace App\Http\Requests\NetworkOpsTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\NetworkOpsCategory;
use App\Models\NetworkOpsTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateNetworkOpsTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var NetworkOpsTeamAssignment $infraTeamAssignment */
        $infraTeamAssignment = $this->route('infra_team_assignment');

        return $this->user()?->can('update', $infraTeamAssignment) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'network_ops_category_id' => ['sometimes', 'required', 'integer', Rule::exists('network_ops_categories', 'id')],
            'user_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'id')],
            'network_ops_level_id' => ['sometimes', 'required', 'integer', Rule::exists('network_ops_levels', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var NetworkOpsTeamAssignment|null $assignment */
            $assignment = $this->route('infra_team_assignment');
            if (! $assignment instanceof NetworkOpsTeamAssignment) {
                return;
            }

            $categoryId = (int) $this->input('network_ops_category_id', $assignment->network_ops_category_id);
            $userId = (int) $this->input('user_id', $assignment->user_id);
            $levelId = (int) $this->input('network_ops_level_id', $assignment->network_ops_level_id);

            $hasChildren = NetworkOpsCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'network_ops_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );

                return;
            }

            $exists = NetworkOpsTeamAssignment::query()
                ->where('network_ops_category_id', $categoryId)
                ->where('user_id', $userId)
                ->where('network_ops_level_id', $levelId)
                ->whereKeyNot($assignment->id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('network_ops_category_id', __('messages.validation.unique'));
            }
        });
    }
}
