<?php

declare(strict_types=1);

namespace App\Http\Requests\NetworkOpsLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\NetworkOpsLicense;
use Illuminate\Foundation\Http\FormRequest;

class UpdateNetworkOpsLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        /** @var NetworkOpsLicense $networkOpsLicense */
        $networkOpsLicense = $this->route('network_ops_license');

        return $this->user()?->can('update', $networkOpsLicense) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseUpdateRules();
    }
}
