<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasLicenseAttributes;
use App\Models\Contracts\LicenseRecord;
use Database\Factories\InfraLicenseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;

class InfraLicense extends Model implements LicenseRecord
{
    /** @use HasFactory<InfraLicenseFactory> */
    use HasFactory, HasLicenseAttributes, LogsActivity, SoftDeletes;

    protected $table = 'infra_licenses';
}
