<?php

declare(strict_types=1);

namespace App\Http\Requests\ApplicationAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ApplicationAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBulkApplicationAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', ApplicationAssignment::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'application_id' => ['required', 'integer', Rule::exists('applications', 'id')],
            'users' => ['required', 'array', 'min:1'],
            'users.*.user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'users.*.app_role_id' => ['required', 'integer', Rule::exists('app_roles', 'id')],
            'users.*.is_primary' => ['sometimes', 'boolean'],
            'users.*.remarks' => ['nullable', 'string'],
        ];
    }
}
