<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Support\DashboardWidgets;
use Illuminate\Foundation\Http\FormRequest;
use Spatie\Permission\Models\Role;

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

                    if (array_key_exists('roles', $value)) {
                        if (! is_array($value['roles'])) {
                            $fail(__('validation.array', ['attribute' => $attribute.'.roles']));

                            return;
                        }

                        foreach ($value['roles'] as $roleId => $map) {
                            if (! is_numeric($roleId)) {
                                $fail(__('validation.in', ['attribute' => $attribute.'.roles']));

                                return;
                            }

                            if (! is_array($map)) {
                                $fail(__('validation.array', ['attribute' => $attribute.'.roles.'.$roleId]));

                                return;
                            }

                            foreach (array_keys($map) as $widgetKey) {
                                if (! in_array($widgetKey, DashboardWidgets::keys(), true)) {
                                    $fail(__('validation.in', ['attribute' => $attribute.'.roles.'.$roleId]));

                                    return;
                                }
                            }
                        }

                        return;
                    }

                    if (! DashboardWidgets::isLegacyFlatMap($value) && $value !== []) {
                        $fail(__('validation.in', ['attribute' => $attribute]));
                    }
                },
            ],
            'settings.dashboard_widgets.roles' => ['sometimes', 'required', 'array'],
            'settings.dashboard_widgets.roles.*' => ['required', 'array'],
        ];

        foreach (DashboardWidgets::keys() as $key) {
            $rules['settings.dashboard_widgets.'.$key] = ['sometimes', 'required', 'boolean'];
            $rules['settings.dashboard_widgets.roles.*.'.$key] = ['sometimes', 'required', 'boolean'];
        }

        $roleIds = Role::query()->pluck('id')->map(static fn ($id): int => (int) $id)->all();
        $rules['settings.dashboard_widgets.roles'] = [
            'sometimes',
            'required',
            'array',
            function (string $attribute, mixed $value, \Closure $fail) use ($roleIds): void {
                if (! is_array($value)) {
                    return;
                }

                foreach (array_keys($value) as $roleId) {
                    if (! in_array((int) $roleId, $roleIds, true)) {
                        $fail(__('validation.exists', ['attribute' => $attribute]));

                        return;
                    }
                }
            },
        ];

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    public function settingsPayload(): array
    {
        return (array) $this->validated('settings');
    }
}
