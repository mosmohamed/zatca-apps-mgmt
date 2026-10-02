<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Models\SmartFacilitiesLicense;

final class SmartFacilitiesLicensesExportDefinition extends AbstractLicensesExportDefinition
{
    public function key(): string
    {
        return 'smart-facilities-licenses';
    }

    public function permission(): string
    {
        return 'smart-facilities-licenses.export';
    }

    public function filenamePrefix(): string
    {
        return 'Smart Facilities Licenses';
    }

    public function reportTitle(): string
    {
        return 'Smart Facilities Licenses Report';
    }

    public function sheetName(): string
    {
        return 'Smart Facilities Licenses';
    }

    protected function modelClass(): string
    {
        return SmartFacilitiesLicense::class;
    }
}
