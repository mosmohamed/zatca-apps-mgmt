<?php

declare(strict_types=1);

namespace App\Http\Requests\ReleaseManagementCategory;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ReleaseManagementCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReleaseManagementCategoryRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ReleaseManagementCategory $infraCategory */
        $infraCategory = $this->route('infra_category');

        return $this->user()?->can('update', $infraCategory) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ReleaseManagementCategory|int|string|null $infraCategory */
        $infraCategory = $this->route('infra_category');
        $infraCategoryId = $infraCategory instanceof ReleaseManagementCategory ? $infraCategory->id : $infraCategory;

        return [
            'parent_id' => ['nullable', 'integer', Rule::exists('release_management_categories', 'id')],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('release_management_categories', 'code')->ignore($infraCategoryId)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
