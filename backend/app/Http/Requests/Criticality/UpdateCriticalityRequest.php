<?php

declare(strict_types=1);

namespace App\Http\Requests\Criticality;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\Criticality;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCriticalityRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var Criticality $criticality */
        $criticality = $this->route('criticality');

        return $this->user()?->can('update', $criticality) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Criticality|int|string|null $criticality */
        $criticality = $this->route('criticality');
        $criticalityId = $criticality instanceof Criticality ? $criticality->id : $criticality;

        return [
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('criticalities', 'code')->ignore($criticalityId)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
