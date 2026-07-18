<?php

declare(strict_types=1);

namespace App\Http\Requests\RoleMappingRule;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\RoleMappingRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleMappingRuleRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', RoleMappingRule::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'identity_provider_id' => ['required', 'integer', 'exists:identity_providers,id'],
            'claim_name' => ['required', 'string', 'max:255'],
            'external_value' => ['required', 'string', 'max:255'],
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where('guard_name', 'web'),
            ],
            'priority' => ['sometimes', 'integer', 'min:-2147483648', 'max:2147483647'],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }
}
