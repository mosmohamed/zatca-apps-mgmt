<?php

declare(strict_types=1);

namespace App\Http\Requests\JobTitle;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\JobTitle;
use Illuminate\Foundation\Http\FormRequest;

class UpdateJobTitleRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var JobTitle $jobTitle */
        $jobTitle = $this->route('job_title');

        return $this->user()?->can('update', $jobTitle) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
