# Configurable Interface Text

## Purpose

Administrators with `settings.update` permission can manage localized interface text from
**Settings → Branding** without deploying code.

## Settings

| Key | Location | Language |
|---|---|---|
| `sidebar_tagline_en` | Sidebar subtitle | English |
| `sidebar_tagline_ar` | Sidebar subtitle | Arabic |
| `header_subtitle_en` | Header subtitle | English |
| `header_subtitle_ar` | Header subtitle | Arabic |

The current application language selects the corresponding English or Arabic value.

## Database changes

Migration `2026_07_17_165000_add_branding_settings.php` adds four public string settings.
The migration and `SettingsSeeder` are idempotent and preserve existing seeded values.

## API

- `GET /api/v1/settings/public` exposes the values to the interface.
- `PUT /api/v1/settings` updates the values for authorized administrators.

Each value is required when submitted. Sidebar values allow up to 255 characters; header
subtitle values allow up to 500 characters.
