<?php

declare(strict_types=1);

namespace App\Http\Requests\InfraLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\InfraLicense;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInfraLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var InfraLicense $infraLicense */
        $infraLicense = $this->route('infra_license');

        return $this->user()?->can('update', $infraLicense) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseUpdateRules();
    }
}
