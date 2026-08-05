<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraLevel;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInfraLevelRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var InfraLevel $infraLevel */
        $infraLevel = $this->route('infra_level');

        return $this->user()?->can('update', $infraLevel) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var InfraLevel|int|string|null $infraLevel */
        $infraLevel = $this->route('infra_level');
        $infraLevelId = $infraLevel instanceof InfraLevel ? $infraLevel->id : $infraLevel;

        return [
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('infra_levels', 'code')->ignore($infraLevelId)],
            'note_en' => ['nullable', 'string', 'max:255'],
            'note_ar' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
