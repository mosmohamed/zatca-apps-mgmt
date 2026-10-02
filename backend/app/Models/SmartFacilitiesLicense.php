<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasLicenseAttributes;
use App\Models\Contracts\LicenseRecord;
use Database\Factories\SmartFacilitiesLicenseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;

class SmartFacilitiesLicense extends Model implements LicenseRecord
{
    /** @use HasFactory<SmartFacilitiesLicenseFactory> */
    use HasFactory, HasLicenseAttributes, LogsActivity, SoftDeletes;

    protected $table = 'smart_facilities_licenses';
}
