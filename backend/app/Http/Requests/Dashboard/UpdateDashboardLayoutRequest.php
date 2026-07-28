<?php

declare(strict_types=1);

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\UserDashboardLayout;
use App\Support\DashboardWidgets;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDashboardLayoutRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return $this->user()?->can('update', UserDashboardLayout::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'widget_order' => ['required', 'array', 'min:1'],
            'widget_order.*' => [
                'required',
                'string',
                'distinct',
                Rule::in(DashboardWidgets::keys()),
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public function widgetOrder(): array
    {
        /** @var array<int, mixed> $order */
        $order = (array) $this->validated('widget_order');

        return array_values(array_map(
            static fn (mixed $key): string => (string) $key,
            $order,
        ));
    }
}
