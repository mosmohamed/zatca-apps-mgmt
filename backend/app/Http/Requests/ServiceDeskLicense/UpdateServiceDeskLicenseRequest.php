<?php

declare(strict_types=1);

namespace App\Http\Requests\ServiceDeskLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ServiceDeskLicense;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceDeskLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var ServiceDeskLicense $serviceDeskLicense */
        $serviceDeskLicense = $this->route('service_desk_license');

        return $this->user()?->can('update', $serviceDeskLicense) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseUpdateRules();
    }
}
