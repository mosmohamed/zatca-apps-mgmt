# Dashboard Widget Layout Configuration

## Purpose

Administrators can control each dashboard widget’s **presentation** (grid span, height,
chrome, chart height, overflow, default order) without code changes.

Three concerns stay separate:

| Concern | Storage | Scope |
|---|---|---|
| Role visibility | `settings.dashboard_widgets` | Per role |
| Presentation / size | `settings.dashboard_widget_layout` | Organization-wide |
| Personal order | `user_dashboard_layouts.widget_order` | Per user |

User drag-and-drop **never** changes width or height.

## Stored shape

Setting key: `dashboard_widget_layout` (JSON, public, group `dashboard`).

```json
{
  "default_order": ["top_technologies", "license_usage", "..."],
  "widgets": {
    "license_usage": {
      "span_desktop": 2,
      "span_tablet": 1,
      "span_mobile": 1,
      "min_height_px": 280,
      "max_height_px": null,
      "chart_height_px": 240,
      "overflow": "auto",
      "show_header": true,
      "show_description": true,
      "show_legend": true,
      "show_filters": true,
      "show_statistics": true,
      "legend_position": "bottom"
    }
  }
}
```

Normalization (`App\Support\DashboardWidgetLayout`) always merges against
`DashboardWidgets::keys()`, so newly added widgets appear automatically with defaults.

## Default order

`DashboardLayoutService::defaultOrder()` reads `default_order` from this setting.
When a user has no custom layout (`is_custom: false`), they see that admin order.
Resetting a user’s personal layout restores the admin default order — not a hardcoded list.

## Frontend

- Settings → Dashboard tab includes a live preview editor
  (`DashboardWidgetLayoutEditor`) with **Reset to default** and **Restore recommended layout**.
- `DashboardPage` applies spans/heights from public settings via
  `DashboardWidgetLayoutContext`.
- Chart cards honor chrome flags and `--dashboard-chart-height`.

## Permissions

Updating layout requires `settings.update` (same as other settings). Reading the
normalized layout is available on `GET /api/v1/settings/public` for all clients.
