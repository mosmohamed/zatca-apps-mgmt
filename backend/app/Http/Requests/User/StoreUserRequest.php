<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', User::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'username' => ['nullable', 'string', 'max:255'],
            'employee_id' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'password_confirmation' => ['required', 'string'],
            'vendor_id' => ['nullable', 'integer', Rule::exists('vendors', 'id')],
            'department_id' => ['nullable', 'integer', Rule::exists('departments', 'id')],
            'profile_picture_url' => ['nullable', 'url', 'max:2048'],
            'phone' => ['nullable', 'string', 'max:50'],
            'teams' => ['nullable', 'string', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'extension' => ['nullable', 'string', 'max:50'],
            'job_title_id' => ['nullable', 'integer', Rule::exists('job_titles', 'id')],
            'is_active' => ['sometimes', 'boolean'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'max:255', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ];
    }
}
