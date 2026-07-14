<?php

declare(strict_types=1);

namespace App\Http\Requests\AppRole;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\AppRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppRoleRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var AppRole $appRole */
        $appRole = $this->route('app_role');

        return $this->user()?->can('update', $appRole) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var AppRole|int|string|null $appRole */
        $appRole = $this->route('app_role');
        $appRoleId = $appRole instanceof AppRole ? $appRole->id : $appRole;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('app_roles', 'name')->ignore($appRoleId)],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
