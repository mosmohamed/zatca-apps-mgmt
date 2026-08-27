<?php

declare(strict_types=1);

namespace App\Http\Requests\Application;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Enums\HaModel;
use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', Application::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')],
            'application_type_id' => ['required', 'integer', Rule::exists('application_types', 'id')],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', Rule::unique('applications', 'code')],
            'description' => ['nullable', 'string'],
            'technical_category' => ['nullable', 'string', 'max:255'],
            'status_id' => ['required', 'integer', Rule::exists('application_statuses', 'id')],
            'criticality_id' => ['required', 'integer', Rule::exists('criticalities', 'id')],
            'business_owners' => ['sometimes', 'array'],
            'business_owners.*' => [
                'integer',
                'distinct',
                Rule::exists('users', 'id')->whereNull('deleted_at'),
            ],
            'technical_owners' => ['sometimes', 'array'],
            'technical_owners.*' => [
                'integer',
                'distinct',
                Rule::exists('users', 'id')->whereNull('deleted_at'),
            ],
            'support_type_id' => ['required', 'integer', Rule::exists('support_types', 'id')],
            'vendor_id' => ['nullable', 'integer', Rule::exists('vendors', 'id')->whereNull('deleted_at')],
            'ha_model' => ['nullable', 'string', Rule::in(HaModel::values())],
            'remarks' => ['nullable', 'string'],
            'documentation_url' => ['nullable', 'url', 'max:2048'],
            'repository_url' => ['nullable', 'url', 'max:2048'],
            'technologies' => ['sometimes', 'array'],
            'technologies.*' => ['integer', 'distinct', Rule::exists('technologies', 'id')->whereNull('deleted_at')],
        ];
    }
}
