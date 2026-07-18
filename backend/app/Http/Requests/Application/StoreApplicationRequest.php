<?php

declare(strict_types=1);

namespace App\Http\Requests\Application;

use App\Enums\HaModel;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
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
            'status_id' => ['required', 'integer', Rule::exists('application_statuses', 'id')],
            'criticality_id' => ['required', 'integer', Rule::exists('criticalities', 'id')],
            'business_owner' => ['nullable', 'string', 'max:255'],
            'technical_owner' => ['nullable', 'string', 'max:255'],
            'support_type_id' => ['required', 'integer', Rule::exists('support_types', 'id')],
            'ha_model' => ['nullable', 'string', Rule::in(HaModel::values())],
            'documentation_url' => ['nullable', 'url', 'max:2048'],
            'repository_url' => ['nullable', 'url', 'max:2048'],
            'technologies' => ['sometimes', 'array'],
            'technologies.*' => ['integer', Rule::exists('technologies', 'id')->whereNull('deleted_at')],
        ];
    }
}
