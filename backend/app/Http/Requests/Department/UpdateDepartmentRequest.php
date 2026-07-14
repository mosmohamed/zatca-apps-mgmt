<?php

declare(strict_types=1);

namespace App\Http\Requests\Department;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var Department $department */
        $department = $this->route('department');

        return $this->user()?->can('update', $department) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
