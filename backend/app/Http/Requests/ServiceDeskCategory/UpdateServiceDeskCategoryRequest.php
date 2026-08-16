<?php

declare(strict_types=1);

namespace App\Http\Requests\ServiceDeskCategory;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ServiceDeskCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceDeskCategoryRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ServiceDeskCategory $infraCategory */
        $infraCategory = $this->route('infra_category');

        return $this->user()?->can('update', $infraCategory) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ServiceDeskCategory|int|string|null $infraCategory */
        $infraCategory = $this->route('infra_category');
        $infraCategoryId = $infraCategory instanceof ServiceDeskCategory ? $infraCategory->id : $infraCategory;

        return [
            'parent_id' => ['nullable', 'integer', Rule::exists('service_desk_categories', 'id')],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('service_desk_categories', 'code')->ignore($infraCategoryId)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
