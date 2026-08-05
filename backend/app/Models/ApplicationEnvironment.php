<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Hosting, internet exposure and operational profile of one application inside
 * one environment (DEV / TEST / STG / PROD).
 */
class ApplicationEnvironment extends Model
{
    use LogsActivity, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_id',
        'environment_id',

        'hosting_model',
        'deployment_type',
        'cloud_provider',
        'cloud_account',
        'region',
        'availability_zone',
        'data_center',
        'cluster_name',
        'cluster_ip',
        'namespace',
        'resource_group',
        'tenant',
        'network_zone',
        'notes',

        'published_to_internet',
        'public_ip',
        'public_domain',
        'public_url',
        'internet_facing_lb',
        'waf_enabled',
        'waf_provider',
        'cdn_enabled',
        'cdn_provider',
        'tls_certificate',
        'external_port',
        'exposure_type',
        'publication_owner',
        'internet_notes',

        'monitoring_enabled',
        'monitoring_tool',
        'logging_enabled',
        'logging_platform',
        'apm_tool',
        'dashboard_url',
        'health_check_url',
        'support_team',
        'operations_owner',
        'on_call_group',
        'runbook_url',
        'documentation_url',
        'repository_url',
        'cicd_pipeline_url',
        'backup_enabled',
        'disaster_recovery_enabled',
        'disaster_recovery_environment',
        'rpo',
        'rto',
        'operational_notes',

        'created_by',
        'updated_by',
    ];

    /**
     * Columns that are never copied when cloning a profile into another
     * environment, because they identify or audit the row itself.
     *
     * @var list<string>
     */
    public const NON_COPYABLE_COLUMNS = [
        'id',
        'application_id',
        'environment_id',
        'open_environment_key',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'application_id' => 'integer',
            'environment_id' => 'integer',
            'published_to_internet' => 'boolean',
            'waf_enabled' => 'boolean',
            'cdn_enabled' => 'boolean',
            'external_port' => 'integer',
            'monitoring_enabled' => 'boolean',
            'logging_enabled' => 'boolean',
            'backup_enabled' => 'boolean',
            'disaster_recovery_enabled' => 'boolean',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /**
     * @return BelongsTo<Environment, $this>
     */
    public function environment(): BelongsTo
    {
        return $this->belongsTo(Environment::class);
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
     * @return HasMany<ApplicationServer, $this>
     */
    public function servers(): HasMany
    {
        return $this->hasMany(ApplicationServer::class);
    }

    /**
     * @return HasMany<ApplicationDatabase, $this>
     */
    public function databases(): HasMany
    {
        return $this->hasMany(ApplicationDatabase::class);
    }

    /**
     * @return HasMany<ApplicationNetwork, $this>
     */
    public function networks(): HasMany
    {
        return $this->hasMany(ApplicationNetwork::class);
    }

    /**
     * @return HasMany<ApplicationDnsRecord, $this>
     */
    public function dnsRecords(): HasMany
    {
        return $this->hasMany(ApplicationDnsRecord::class);
    }

    /**
     * @return HasMany<ApplicationListener, $this>
     */
    public function listeners(): HasMany
    {
        return $this->hasMany(ApplicationListener::class);
    }

    /**
     * @return HasMany<ApplicationLoadBalancer, $this>
     */
    public function loadBalancers(): HasMany
    {
        return $this->hasMany(ApplicationLoadBalancer::class);
    }

    /**
     * @return HasMany<ApplicationIntegration, $this>
     */
    public function integrations(): HasMany
    {
        return $this->hasMany(ApplicationIntegration::class);
    }

    /**
     * @return HasMany<ApplicationMessageBroker, $this>
     */
    public function messageBrokers(): HasMany
    {
        return $this->hasMany(ApplicationMessageBroker::class);
    }

    /**
     * @return HasMany<ApplicationStorageResource, $this>
     */
    public function storageResources(): HasMany
    {
        return $this->hasMany(ApplicationStorageResource::class);
    }
}
