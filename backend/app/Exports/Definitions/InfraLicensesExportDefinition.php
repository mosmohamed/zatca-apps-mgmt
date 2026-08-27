<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Models\InfraLicense;

final class InfraLicensesExportDefinition extends AbstractLicensesExportDefinition
{
    public function key(): string
    {
        return 'infra-licenses';
    }

    public function permission(): string
    {
        return 'infra-licenses.export';
    }

    public function filenamePrefix(): string
    {
        return 'Infra Licenses';
    }

    public function reportTitle(): string
    {
        return 'Infra Licenses Report';
    }

    public function sheetName(): string
    {
        return 'Infra Licenses';
    }

    protected function modelClass(): string
    {
        return InfraLicense::class;
    }
}
