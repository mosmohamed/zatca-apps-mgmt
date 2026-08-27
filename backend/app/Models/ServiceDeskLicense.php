<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasLicenseAttributes;
use App\Models\Contracts\LicenseRecord;
use Database\Factories\ServiceDeskLicenseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;

class ServiceDeskLicense extends Model implements LicenseRecord
{
    /** @use HasFactory<ServiceDeskLicenseFactory> */
    use HasFactory, HasLicenseAttributes, LogsActivity, SoftDeletes;

    protected $table = 'service_desk_licenses';
}
