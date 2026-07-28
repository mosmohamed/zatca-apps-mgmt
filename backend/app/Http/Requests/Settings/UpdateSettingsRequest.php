<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Support\DashboardWidgetLayout;
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
            'settings.sidebar_tagline_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'settings.sidebar_tagline_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
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

        $rules['settings.dashboard_widget_layout'] = [
            'sometimes',
            'required',
            'array',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if (! is_array($value)) {
                    return;
                }

                if (array_key_exists('default_order', $value) && ! is_array($value['default_order'])) {
                    $fail(__('validation.array', ['attribute' => $attribute.'.default_order']));

                    return;
                }

                if (array_key_exists('default_order', $value) && is_array($value['default_order'])) {
                    foreach ($value['default_order'] as $widgetKey) {
                        if (! is_string($widgetKey) || ! in_array($widgetKey, DashboardWidgets::keys(), true)) {
                            $fail(__('validation.in', ['attribute' => $attribute.'.default_order']));

                            return;
                        }
                    }
                }

                if (array_key_exists('widgets', $value) && ! is_array($value['widgets'])) {
                    $fail(__('validation.array', ['attribute' => $attribute.'.widgets']));

                    return;
                }

                if (! is_array($value['widgets'] ?? null)) {
                    return;
                }

                foreach ($value['widgets'] as $widgetKey => $widget) {
                    if (! is_string($widgetKey) || ! in_array($widgetKey, DashboardWidgets::keys(), true)) {
                        $fail(__('validation.in', ['attribute' => $attribute.'.widgets']));

                        return;
                    }

                    if (! is_array($widget)) {
                        $fail(__('validation.array', ['attribute' => $attribute.'.widgets.'.$widgetKey]));

                        return;
                    }
                }
            },
        ];
        $rules['settings.dashboard_widget_layout.default_order'] = ['sometimes', 'array'];
        $rules['settings.dashboard_widget_layout.default_order.*'] = [
            'string',
            'distinct',
            \Illuminate\Validation\Rule::in(DashboardWidgets::keys()),
        ];
        $rules['settings.dashboard_widget_layout.widgets'] = ['sometimes', 'array'];

        foreach (DashboardWidgets::keys() as $widgetKey) {
            $prefix = 'settings.dashboard_widget_layout.widgets.'.$widgetKey;
            $rules[$prefix] = ['sometimes', 'array'];
            $rules[$prefix.'.span_desktop'] = ['sometimes', 'integer', \Illuminate\Validation\Rule::in(DashboardWidgetLayout::allowedDesktopSpans())];
            $rules[$prefix.'.span_tablet'] = ['sometimes', 'integer', \Illuminate\Validation\Rule::in(DashboardWidgetLayout::allowedTabletSpans())];
            $rules[$prefix.'.span_mobile'] = ['sometimes', 'integer', \Illuminate\Validation\Rule::in([1])];
            $rules[$prefix.'.min_height_px'] = ['sometimes', 'integer', 'min:160', 'max:800'];
            $rules[$prefix.'.max_height_px'] = ['sometimes', 'nullable', 'integer', 'min:160', 'max:1600'];
            $rules[$prefix.'.chart_height_px'] = ['sometimes', 'integer', 'min:120', 'max:640'];
            $rules[$prefix.'.overflow'] = ['sometimes', 'string', \Illuminate\Validation\Rule::in(DashboardWidgetLayout::allowedOverflows())];
            $rules[$prefix.'.show_header'] = ['sometimes', 'boolean'];
            $rules[$prefix.'.show_description'] = ['sometimes', 'boolean'];
            $rules[$prefix.'.show_legend'] = ['sometimes', 'boolean'];
            $rules[$prefix.'.show_filters'] = ['sometimes', 'boolean'];
            $rules[$prefix.'.show_statistics'] = ['sometimes', 'boolean'];
            $rules[$prefix.'.legend_position'] = ['sometimes', 'string', \Illuminate\Validation\Rule::in(DashboardWidgetLayout::allowedLegendPositions())];
        }

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    public function settingsPayload(): array
    {
        $payload = (array) $this->validated('settings');

        foreach (['sidebar_tagline_en', 'sidebar_tagline_ar'] as $key) {
            if (array_key_exists($key, $payload) && $payload[$key] === null) {
                $payload[$key] = '';
            }
        }

        return $payload;
    }
}
