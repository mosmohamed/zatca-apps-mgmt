<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

/**
 * Validation rules shared by the Apps, Infrastructure and Service Desk
 * license catalogues, which expose an identical payload.
 */
trait HasLicenseValidationRules
{
    /**
     * @return array<string, mixed>
     */
    protected function licenseStoreRules(): array
    {
        return [
            'publisher' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'product' => ['required', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'environment' => ['required', 'string', 'max:255'],
            'licensed' => ['required', 'integer', 'min:0'],
            'used' => ['required', 'integer', 'min:0'],
            'proof_of_entitlement' => ['nullable', 'string', 'max:2048'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function licenseUpdateRules(): array
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
