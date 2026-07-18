<?php

declare(strict_types=1);

namespace App\Http\Requests\Sso;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use Illuminate\Foundation\Http\FormRequest;

class SamlAcsRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'SAMLResponse' => ['required', 'string', 'max:1000000'],
            'RelayState' => ['required', 'string', 'size:64'],
        ];
    }
}
