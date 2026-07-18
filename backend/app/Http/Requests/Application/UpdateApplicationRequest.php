<?php

declare(strict_types=1);

namespace App\Http\Requests\Application;

use App\Enums\HaModel;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var Application $application */
        $application = $this->route('application');

        return $this->user()?->can('update', $application) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Application|int|string|null $application */
        $application = $this->route('application');
        $applicationId = $application instanceof Application ? $application->id : $application;

        return [
            'department_id' => ['sometimes', 'required', 'integer', Rule::exists('departments', 'id')],
            'application_type_id' => ['sometimes', 'required', 'integer', Rule::exists('application_types', 'id')],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('applications', 'code')->ignore($applicationId),
            ],
            'status_id' => ['sometimes', 'required', 'integer', Rule::exists('application_statuses', 'id')],
            'criticality_id' => ['sometimes', 'required', 'integer', Rule::exists('criticalities', 'id')],
            'business_owner' => ['nullable', 'string', 'max:255'],
            'technical_owner' => ['nullable', 'string', 'max:255'],
            'support_type_id' => ['sometimes', 'required', 'integer', Rule::exists('support_types', 'id')],
            'ha_model' => ['nullable', 'string', Rule::in(HaModel::values())],
            'documentation_url' => ['nullable', 'url', 'max:2048'],
            'repository_url' => ['nullable', 'url', 'max:2048'],
            'technologies' => ['sometimes', 'array'],
            'technologies.*' => ['integer', Rule::exists('technologies', 'id')->whereNull('deleted_at')],
        ];
    }
}
