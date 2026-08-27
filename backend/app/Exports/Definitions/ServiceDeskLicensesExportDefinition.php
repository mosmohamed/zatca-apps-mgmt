<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Models\ServiceDeskLicense;

final class ServiceDeskLicensesExportDefinition extends AbstractLicensesExportDefinition
{
    public function key(): string
    {
        return 'service-desk-licenses';
    }

    public function permission(): string
    {
        return 'service-desk-licenses.export';
    }

    public function filenamePrefix(): string
    {
        return 'SD Licenses';
    }

    public function reportTitle(): string
    {
        return 'SD Licenses Report';
    }

    public function sheetName(): string
    {
        return 'SD Licenses';
    }

    protected function modelClass(): string
    {
        return ServiceDeskLicense::class;
    }
}
