<?php

declare(strict_types=1);

namespace App\Http\Requests\License;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\License;
use Illuminate\Foundation\Http\FormRequest;

class StoreLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', License::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseStoreRules();
    }
}
