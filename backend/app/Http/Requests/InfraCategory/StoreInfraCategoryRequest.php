<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraCategory;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInfraCategoryRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', InfraCategory::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'parent_id' => ['nullable', 'integer', Rule::exists('infra_categories', 'id')],
            'name_en' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', Rule::unique('infra_categories', 'code')],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
