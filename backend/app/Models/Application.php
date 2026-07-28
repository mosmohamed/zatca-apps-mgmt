<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HaModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Application extends Model
{
    /** @use HasFactory<\Database\Factories\ApplicationFactory> */
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'department_id',
        'application_type_id',
        'name_ar',
        'name_en',
        'code',
        'status_id',
        'criticality_id',
        'support_type_id',
        'ha_model',
        'documentation_url',
        'repository_url',
        'created_by',
        'updated_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'department_id' => 'integer',
            'application_type_id' => 'integer',
            'status_id' => 'integer',
            'criticality_id' => 'integer',
            'support_type_id' => 'integer',
            'ha_model' => HaModel::class,
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    /**
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * @return BelongsTo<ApplicationType, $this>
     */
    public function applicationType(): BelongsTo
    {
        return $this->belongsTo(ApplicationType::class);
    }

    /**
     * @return BelongsTo<ApplicationStatus, $this>
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(ApplicationStatus::class, 'status_id');
    }

    /**
     * @return BelongsTo<Criticality, $this>
     */
    public function criticality(): BelongsTo
    {
        return $this->belongsTo(Criticality::class);
    }

    /**
     * @return BelongsTo<SupportType, $this>
     */
    public function supportType(): BelongsTo
    {
        return $this->belongsTo(SupportType::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @return HasMany<ApplicationAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(ApplicationAssignment::class);
    }

    /**
     * @return BelongsToMany<Technology, $this>
     */
    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class)
            ->withTimestamps();
    }

    /**
     * ZATCA Management stakeholders for this application.
     *
     * @return BelongsToMany<User, $this>
     */
    public function businessOwners(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'application_business_owners')
            ->withTimestamps()
            ->orderBy('first_name')
            ->orderBy('last_name');
    }

    /**
     * Technical owners for this application.
     *
     * @return BelongsToMany<User, $this>
     */
    public function technicalOwners(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'application_technical_owners')
            ->withTimestamps()
            ->orderBy('first_name')
            ->orderBy('last_name');
    }

    /**
     * @return HasMany<ApplicationEnvironment, $this>
     */
    public function applicationEnvironments(): HasMany
    {
        return $this->hasMany(ApplicationEnvironment::class);
    }
}
