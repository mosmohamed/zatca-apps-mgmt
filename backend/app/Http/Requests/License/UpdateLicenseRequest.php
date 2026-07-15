<?php

declare(strict_types=1);

namespace App\Http\Requests\License;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\License;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLicenseRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var License $license */
        $license = $this->route('license');

        return $this->user()?->can('update', $license) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'publisher' => ['sometimes', 'required', 'string', 'max:255'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'product' => ['sometimes', 'required', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'environment' => ['sometimes', 'required', 'string', 'max:255'],
            'licensed' => ['sometimes', 'required', 'integer', 'min:0'],
            'used' => ['sometimes', 'required', 'integer', 'min:0'],
            'proof_of_entitlement' => ['nullable', 'string', 'max:2048'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }
}
