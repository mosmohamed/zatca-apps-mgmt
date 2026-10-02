<?php

declare(strict_types=1);

namespace App\Http\Requests\NetworkOpsCategory;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\NetworkOpsCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNetworkOpsCategoryRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var NetworkOpsCategory $infraCategory */
        $infraCategory = $this->route('infra_category');

        return $this->user()?->can('update', $infraCategory) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var NetworkOpsCategory|int|string|null $infraCategory */
        $infraCategory = $this->route('infra_category');
        $infraCategoryId = $infraCategory instanceof NetworkOpsCategory ? $infraCategory->id : $infraCategory;

        return [
            'parent_id' => ['nullable', 'integer', Rule::exists('network_ops_categories', 'id')],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('network_ops_categories', 'code')->ignore($infraCategoryId)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
