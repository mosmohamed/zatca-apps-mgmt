<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Support\DashboardWidgets;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('settings.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'settings' => ['required', 'array', 'min:1'],
            'settings.*' => ['nullable'],
            'settings.company_name' => ['sometimes', 'required', 'string', 'max:255'],
            'settings.sidebar_tagline_en' => ['sometimes', 'required', 'string', 'max:255'],
            'settings.sidebar_tagline_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'settings.header_subtitle_en' => ['sometimes', 'required', 'string', 'max:500'],
            'settings.header_subtitle_ar' => ['sometimes', 'required', 'string', 'max:500'],
            'settings.default_timezone' => ['sometimes', 'required', 'string', 'max:100'],
            'settings.default_pagination_size' => ['sometimes', 'required', 'integer', 'min:5', 'max:100'],
            'settings.dashboard_widgets' => [
                'sometimes',
                'required',
                'array',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_array($value)) {
                        return;
                    }

                    foreach (array_keys($value) as $key) {
                        if (! in_array($key, DashboardWidgets::keys(), true)) {
                            $fail(__('validation.in', ['attribute' => $attribute]));

                            return;
                        }
                    }
                },
            ],
        ];

        foreach (DashboardWidgets::keys() as $key) {
            $rules['settings.dashboard_widgets.'.$key] = ['sometimes', 'required', 'boolean'];
        }

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    public function settingsPayload(): array
    {
        $payload = (array) $this->validated('settings');

        if (array_key_exists(DashboardWidgets::SETTING_KEY, $payload)) {
            $payload[DashboardWidgets::SETTING_KEY] = DashboardWidgets::normalize(
                $payload[DashboardWidgets::SETTING_KEY]
            );
        }

        return $payload;
    }
}
