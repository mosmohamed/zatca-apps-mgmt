<?php

declare(strict_types=1);

namespace App\Http\Requests\RoleMappingRule;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\RoleMappingRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleMappingRuleRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var RoleMappingRule|null $rule */
        $rule = $this->route('role_mapping');

        return $rule !== null && ($this->user()?->can('update', $rule) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'identity_provider_id' => ['sometimes', 'required', 'integer', 'exists:identity_providers,id'],
            'claim_name' => ['sometimes', 'required', 'string', 'max:255'],
            'external_value' => ['sometimes', 'required', 'string', 'max:255'],
            'role_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('roles', 'id')->where('guard_name', 'web'),
            ],
            'priority' => ['sometimes', 'integer', 'min:-2147483648', 'max:2147483647'],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }
}
