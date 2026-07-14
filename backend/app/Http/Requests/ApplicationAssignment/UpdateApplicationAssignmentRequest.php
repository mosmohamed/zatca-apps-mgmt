<?php

declare(strict_types=1);

namespace App\Http\Requests\ApplicationAssignment;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ApplicationAssignment;
use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationAssignmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ApplicationAssignment $assignment */
        $assignment = $this->route('assignment')
            ?? $this->route('application_assignment')
            ?? $this->route('applicationAssignment');

        return $this->user()?->can('update', $assignment) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Role / user / application changes must go through Store (assign) to preserve history.
        return [
            'is_primary' => ['sometimes', 'boolean'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
