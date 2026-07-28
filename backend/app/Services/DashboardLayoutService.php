<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\User;
use App\Models\UserDashboardLayout;
use App\Support\DashboardWidgetLayout;
use App\Support\DashboardWidgets;
use Illuminate\Support\Facades\DB;

/**
 * Resolves and persists the per-user dashboard widget ordering.
 *
 * @phpstan-type LayoutPayload array{widget_order: list<string>, is_custom: bool}
 */
class DashboardLayoutService
{
    public function __construct(
        private readonly SettingsService $settingsService,
    ) {
    }

    /**
     * @return LayoutPayload
     */
    public function getForUser(User $user): array
    {
        $layout = $this->findLayout($user);

        if ($layout === null) {
            return [
                'widget_order' => $this->defaultOrder(),
                'is_custom' => false,
            ];
        }

        return [
            'widget_order' => $this->reconcile($layout->widget_order),
            'is_custom' => true,
        ];
    }

    /**
     * @param  array<int|string, mixed>  $widgetOrder
     * @return LayoutPayload
     */
    public function updateForUser(User $user, array $widgetOrder): array
    {
        $stored = $this->sanitize($widgetOrder);

        $layout = DB::transaction(static fn (): UserDashboardLayout => UserDashboardLayout::query()->updateOrCreate(
            ['user_id' => $user->getKey()],
            ['widget_order' => $stored],
        ));

        activity('dashboard_layout')
            ->causedBy($user)
            ->performedOn($layout)
            ->withProperties(['widget_order' => $stored])
            ->log('dashboard_layout.updated');

        $user->setRelation('dashboardLayout', $layout);

        return [
            'widget_order' => $this->reconcile($stored),
            'is_custom' => true,
        ];
    }

    /**
     * @return LayoutPayload
     */
    public function resetForUser(User $user): array
    {
        DB::transaction(static function () use ($user): void {
            UserDashboardLayout::query()->where('user_id', $user->getKey())->delete();
        });

        activity('dashboard_layout')
            ->causedBy($user)
            ->withProperties(['user_id' => $user->getKey()])
            ->log('dashboard_layout.reset');

        $user->setRelation('dashboardLayout', null);

        return [
            'widget_order' => $this->defaultOrder(),
            'is_custom' => false,
        ];
    }

    /**
     * Admin-configured default order from dashboard_widget_layout.
     * Falls back to the canonical widget key list when unset.
     *
     * @return list<string>
     */
    public function defaultOrder(): array
    {
        $layout = DashboardWidgetLayout::normalize(
            $this->settingsService->get(DashboardWidgetLayout::SETTING_KEY)
        );

        return $layout['default_order'];
    }

    private function findLayout(User $user): ?UserDashboardLayout
    {
        return UserDashboardLayout::query()
            ->where('user_id', $user->getKey())
            ->first();
    }

    /**
     * Keeps the saved ordering for widget keys that still exist, drops unknown
     * keys, and appends newly introduced widgets at the end.
     *
     * @return list<string>
     */
    private function reconcile(mixed $saved): array
    {
        $known = $this->defaultOrder();
        $ordered = [];

        if (is_array($saved)) {
            foreach ($saved as $key) {
                if (! is_string($key) || ! in_array($key, $known, true)) {
                    continue;
                }

                if (! in_array($key, $ordered, true)) {
                    $ordered[] = $key;
                }
            }
        }

        foreach ($known as $key) {
            if (! in_array($key, $ordered, true)) {
                $ordered[] = $key;
            }
        }

        return $ordered;
    }

    /**
     * @param  array<int|string, mixed>  $widgetOrder
     * @return list<string>
     */
    private function sanitize(array $widgetOrder): array
    {
        $known = DashboardWidgets::keys();
        $ordered = [];

        foreach ($widgetOrder as $key) {
            if (! is_string($key) || ! in_array($key, $known, true)) {
                throw new DomainException(__('messages.dashboard_layout.unknown_widget'));
            }

            if (! in_array($key, $ordered, true)) {
                $ordered[] = $key;
            }
        }

        if ($ordered === []) {
            throw new DomainException(__('messages.dashboard_layout.unknown_widget'));
        }

        return $ordered;
    }
}
