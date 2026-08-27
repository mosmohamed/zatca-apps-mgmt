<?php

declare(strict_types=1);

namespace App\Http\Requests\License;

use App\Http\Requests\Concerns\HasLicenseValidationRules;
use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\License;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLicenseRequest extends FormRequest
{
    use HasLicenseValidationRules;
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
        return $this->licenseUpdateRules();
    }
}
