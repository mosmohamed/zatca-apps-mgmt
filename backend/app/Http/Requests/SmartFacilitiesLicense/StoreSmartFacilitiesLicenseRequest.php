<?php

declare(strict_types=1);

namespace App\Http\Requests\SmartFacilitiesLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\SmartFacilitiesLicense;
use Illuminate\Foundation\Http\FormRequest;

class StoreSmartFacilitiesLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', SmartFacilitiesLicense::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseStoreRules();
    }
}
