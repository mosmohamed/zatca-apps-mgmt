<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraCategory;
use App\Models\InfraTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInfraTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', InfraTeamAssignment::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'infra_category_id' => ['required', 'integer', Rule::exists('infra_categories', 'id')],
            'users' => ['required', 'array', 'min:1'],
            'users.*.user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'users.*.infra_level_id' => ['required', 'integer', Rule::exists('infra_levels', 'id')],
            'users.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $categoryId = (int) $this->input('infra_category_id');
            if ($categoryId <= 0) {
                return;
            }

            $hasChildren = InfraCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'infra_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );
            }

            /** @var list<array{user_id?: mixed, infra_level_id?: mixed}> $users */
            $users = $this->input('users', []);
            $seen = [];

            foreach ($users as $index => $user) {
                $key = ((int) ($user['user_id'] ?? 0)).':'.((int) ($user['infra_level_id'] ?? 0));
                if (isset($seen[$key])) {
                    $validator->errors()->add(
                        "users.{$index}.infra_level_id",
                        __('messages.validation.unique'),
                    );

                    continue;
                }
                $seen[$key] = true;
            }
        });
    }
}
