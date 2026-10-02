<?php

declare(strict_types=1);

namespace App\Exports\Definitions;

use App\Models\NetworkOpsLicense;

final class NetworkOpsLicensesExportDefinition extends AbstractLicensesExportDefinition
{
    public function key(): string
    {
        return 'network-ops-licenses';
    }

    public function permission(): string
    {
        return 'network-ops-licenses.export';
    }

    public function filenamePrefix(): string
    {
        return 'Network Ops Licenses';
    }

    public function reportTitle(): string
    {
        return 'Network Ops Licenses Report';
    }

    public function sheetName(): string
    {
        return 'Network Ops Licenses';
    }

    protected function modelClass(): string
    {
        return NetworkOpsLicense::class;
    }
}
