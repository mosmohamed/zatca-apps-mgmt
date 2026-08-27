<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraLicense;
use Illuminate\Foundation\Http\FormRequest;

class StoreInfraLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', InfraLicense::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseStoreRules();
    }
}
