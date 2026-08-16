<?php

declare(strict_types=1);

namespace App\Http\Requests\ServiceDeskTeamAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskTeamAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreServiceDeskTeamAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', ServiceDeskTeamAssignment::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'service_desk_category_id' => ['required', 'integer', Rule::exists('service_desk_categories', 'id')],
            'users' => ['required', 'array', 'min:1'],
            'users.*.user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'users.*.service_desk_level_id' => ['required', 'integer', Rule::exists('service_desk_levels', 'id')],
            'users.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $categoryId = (int) $this->input('service_desk_category_id');
            if ($categoryId <= 0) {
                return;
            }

            $hasChildren = ServiceDeskCategory::query()
                ->where('parent_id', $categoryId)
                ->where('is_active', true)
                ->exists();

            if ($hasChildren) {
                $validator->errors()->add(
                    'service_desk_category_id',
                    __('messages.validation.infra_category_must_be_leaf'),
                );
            }

            /** @var list<array{user_id?: mixed, service_desk_level_id?: mixed}> $users */
            $users = $this->input('users', []);
            $seen = [];

            foreach ($users as $index => $user) {
                $key = ((int) ($user['user_id'] ?? 0)).':'.((int) ($user['service_desk_level_id'] ?? 0));
                if (isset($seen[$key])) {
                    $validator->errors()->add(
                        "users.{$index}.service_desk_level_id",
                        __('messages.validation.unique'),
                    );

                    continue;
                }
                $seen[$key] = true;
            }
        });
    }
}
