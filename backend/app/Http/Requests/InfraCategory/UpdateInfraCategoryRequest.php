<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraCategory;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInfraCategoryRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var InfraCategory $infraCategory */
        $infraCategory = $this->route('infra_category');

        return $this->user()?->can('update', $infraCategory) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var InfraCategory|int|string|null $infraCategory */
        $infraCategory = $this->route('infra_category');
        $infraCategoryId = $infraCategory instanceof InfraCategory ? $infraCategory->id : $infraCategory;

        return [
            'parent_id' => ['nullable', 'integer', Rule::exists('infra_categories', 'id')],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('infra_categories', 'code')->ignore($infraCategoryId)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
