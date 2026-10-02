<?php

declare(strict_types=1);

namespace App\Http\Requests\SmartFacilitiesLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\SmartFacilitiesLicense;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSmartFacilitiesLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var SmartFacilitiesLicense $smartFacilitiesLicense */
        $smartFacilitiesLicense = $this->route('smart_facilities_license');

        return $this->user()?->can('update', $smartFacilitiesLicense) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseUpdateRules();
    }
}
