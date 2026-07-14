<?php

declare(strict_types=1);

namespace App\Http\Requests\SupportType;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\SupportType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupportTypeRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var SupportType $supportType */
        $supportType = $this->route('support_type');

        return $this->user()?->can('update', $supportType) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var SupportType|int|string|null $supportType */
        $supportType = $this->route('support_type');
        $supportTypeId = $supportType instanceof SupportType ? $supportType->id : $supportType;

        return [
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('support_types', 'code')->ignore($supportTypeId)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
