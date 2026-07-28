<?php

declare(strict_types=1);

namespace App\Http\Requests\ApplicationInfrastructure;

use App\Http\Requests\Concerns\HasInfrastructureValidationMessages;
use App\Http\Requests\Concerns\NormalizesBooleanInput;
use App\Models\ApplicationEnvironment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CopyApplicationEnvironmentRequest extends FormRequest
{
    use HasInfrastructureValidationMessages;
    use NormalizesBooleanInput;

    public function authorize(): bool
    {
        return $this->user()?->can('copyEnvironment', ApplicationEnvironment::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeBooleanInput(['overwrite']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'source_environment_id' => [
                'required',
                'integer',
                Rule::exists('environments', 'id'),
            ],
            'target_environment_id' => [
                'required',
                'integer',
                'different:source_environment_id',
                Rule::exists('environments', 'id'),
            ],
            'overwrite' => ['sometimes', 'boolean'],
        ];
    }
}
