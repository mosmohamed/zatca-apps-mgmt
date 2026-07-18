<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Support\AuthenticationMode;
use App\Support\AuthenticationRoleMappingSettings;
use App\Support\DashboardWidgets;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'settings.authentication_mode' => [
                'sometimes',
                'required',
                'string',
                Rule::in(AuthenticationMode::values()),
            ],
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
            'settings.authentication_role_mapping' => ['sometimes', 'required', 'array'],
            'settings.authentication_role_mapping.enabled' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.auto_provisioning' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.allow_email_account_linking' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.require_verified_email_for_linking' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.automatic_department_mapping' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.department_claim' => ['required_with:settings.authentication_role_mapping', 'string', 'max:255'],
            'settings.authentication_role_mapping.default_role_id' => [
                'nullable',
                'integer',
                Rule::exists('roles', 'id')->where('guard_name', 'web'),
            ],
            'settings.authentication_role_mapping.default_user_status' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.update_roles_on_login' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.update_user_information_on_login' => ['required_with:settings.authentication_role_mapping', 'boolean'],
            'settings.authentication_role_mapping.multi_match_strategy' => ['required_with:settings.authentication_role_mapping', 'in:multiple,highest_priority'],
            'settings.authentication_role_mapping.sync_fields' => ['required_with:settings.authentication_role_mapping', 'array'],
        ];

        foreach (DashboardWidgets::keys() as $key) {
            $rules['settings.dashboard_widgets.'.$key] = ['sometimes', 'required', 'boolean'];
        }

        foreach (array_keys(AuthenticationRoleMappingSettings::defaults()['sync_fields']) as $field) {
            $rules['settings.authentication_role_mapping.sync_fields.'.$field] = [
                'required_with:settings.authentication_role_mapping',
                'boolean',
            ];
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

        if (array_key_exists(AuthenticationRoleMappingSettings::KEY, $payload)) {
            $payload[AuthenticationRoleMappingSettings::KEY] = AuthenticationRoleMappingSettings::normalize(
                $payload[AuthenticationRoleMappingSettings::KEY],
            );
        }

        if (array_key_exists(AuthenticationMode::KEY, $payload)) {
            $payload[AuthenticationMode::KEY] = AuthenticationMode::normalize(
                $payload[AuthenticationMode::KEY],
            );
        }

        return $payload;
    }
}
