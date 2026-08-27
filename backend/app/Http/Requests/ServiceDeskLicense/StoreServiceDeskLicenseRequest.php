<?php

declare(strict_types=1);

namespace App\Http\Requests\ServiceDeskLicense;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\ServiceDeskLicense;
use Illuminate\Foundation\Http\FormRequest;

class StoreServiceDeskLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('create', ServiceDeskLicense::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->licenseStoreRules();
    }
}
