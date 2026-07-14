<?php

declare(strict_types=1);

namespace App\Http\Requests\Technology;

use App\Enums\TechnologyCategory;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\Technology;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTechnologyRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', Technology::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('technologies', 'name')],
            'category' => ['required', 'string', Rule::in(TechnologyCategory::values())],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
