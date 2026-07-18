<?php

declare(strict_types=1);

namespace App\Http\Requests\Sso;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use Illuminate\Foundation\Http\FormRequest;

class OidcCallbackRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:8192'],
            'state' => ['required', 'string', 'size:64'],
        ];
    }
}
