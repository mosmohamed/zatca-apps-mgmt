<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Export Branding
    |--------------------------------------------------------------------------
    |
    | Configuration used by the configuration-driven export system when
    | rendering the professional Excel report header block.
    |
    */

    'logo_path' => env('EXPORT_LOGO_PATH', storage_path('app/public/branding/logo.png')),

    'company_name_setting_key' => 'company_name',

    'header_fill_color' => env('EXPORT_HEADER_COLOR', '1F4E79'),

    'row_alt_fill_color' => 'F5F7FA',
];
