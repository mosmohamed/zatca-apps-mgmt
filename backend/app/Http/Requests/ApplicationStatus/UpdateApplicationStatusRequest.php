<?php

declare(strict_types=1);

namespace App\Http\Requests\ApplicationStatus;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationStatusRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ApplicationStatus $applicationStatus */
        $applicationStatus = $this->route('application_status');

        return $this->user()?->can('update', $applicationStatus) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ApplicationStatus|int|string|null $applicationStatus */
        $applicationStatus = $this->route('application_status');
        $applicationStatusId = $applicationStatus instanceof ApplicationStatus ? $applicationStatus->id : $applicationStatus;

        return [
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('application_statuses', 'code')->ignore($applicationStatusId)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
