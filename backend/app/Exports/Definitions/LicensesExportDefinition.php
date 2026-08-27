<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Models\License;

final class LicensesExportDefinition extends AbstractLicensesExportDefinition
{
    public function key(): string
    {
        return 'licenses';
    }

    public function permission(): string
    {
        return 'licenses.export';
    }

    public function filenamePrefix(): string
    {
        return 'Apps Licenses';
    }

    public function reportTitle(): string
    {
        return 'Apps Licenses Report';
    }

    public function sheetName(): string
    {
        return 'Apps Licenses';
    }

    protected function modelClass(): string
    {
        return License::class;
    }
}
