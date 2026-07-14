<?php

declare(strict_types=1);

namespace App\Http\Requests\Criticality;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\Criticality;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCriticalityRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', Criticality::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', Rule::unique('criticalities', 'code')],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
