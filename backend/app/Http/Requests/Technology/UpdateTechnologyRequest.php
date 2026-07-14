<?php

declare(strict_types=1);

namespace App\Http\Requests\Technology;

use App\Enums\TechnologyCategory;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\Technology;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTechnologyRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var Technology $technology */
        $technology = $this->route('technology');

        return $this->user()?->can('update', $technology) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Technology|int|string|null $technology */
        $technology = $this->route('technology');
        $technologyId = $technology instanceof Technology ? $technology->id : $technology;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('technologies', 'name')->ignore($technologyId),
            ],
            'category' => ['sometimes', 'required', 'string', Rule::in(TechnologyCategory::values())],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
