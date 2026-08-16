<?php

declare(strict_types=1);

namespace App\Http\Requests\ServiceDeskLevel;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ServiceDeskLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceDeskLevelRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ServiceDeskLevel $infraLevel */
        $infraLevel = $this->route('infra_level');

        return $this->user()?->can('update', $infraLevel) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ServiceDeskLevel|int|string|null $infraLevel */
        $infraLevel = $this->route('infra_level');
        $infraLevelId = $infraLevel instanceof ServiceDeskLevel ? $infraLevel->id : $infraLevel;

        return [
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('service_desk_levels', 'code')->ignore($infraLevelId)],
            'note_en' => ['nullable', 'string', 'max:255'],
            'note_ar' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
