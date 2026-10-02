<?php

declare(strict_types=1);

namespace App\Http\Requests\ReleaseManagementLevel;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ReleaseManagementLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReleaseManagementLevelRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', ReleaseManagementLevel::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name_en' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', Rule::unique('release_management_levels', 'code')],
            'note_en' => ['nullable', 'string', 'max:255'],
            'note_ar' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
