<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasLicenseAttributes;
use App\Models\Contracts\LicenseRecord;
use Database\Factories\LicenseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Application ("Apps") licenses catalogue.
 */
class License extends Model implements LicenseRecord
{
    /** @use HasFactory<LicenseFactory> */
    use HasFactory, HasLicenseAttributes, LogsActivity, SoftDeletes;
}
