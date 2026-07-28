<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_environments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('environment_id')->constrained()->restrictOnDelete();

            // Hosting profile
            $table->string('hosting_model')->nullable();
            $table->string('deployment_type')->nullable();
            $table->string('cloud_provider')->nullable();
            $table->string('cloud_account')->nullable();
            $table->string('region')->nullable();
            $table->string('availability_zone')->nullable();
            $table->string('data_center')->nullable();
            $table->string('cluster_name')->nullable();
            $table->string('cluster_ip', 45)->nullable();
            $table->string('namespace')->nullable();
            $table->string('resource_group')->nullable();
            $table->string('tenant')->nullable();
            $table->string('network_zone')->nullable();
            $table->text('notes')->nullable();

            // Internet publishing
            $table->boolean('published_to_internet')->default(false)->index();
            $table->string('public_ip', 45)->nullable();
            $table->string('public_domain')->nullable();
            $table->text('public_url')->nullable();
            $table->string('internet_facing_lb')->nullable();
            $table->boolean('waf_enabled')->default(false);
            $table->string('waf_provider')->nullable();
            $table->boolean('cdn_enabled')->default(false);
            $table->string('cdn_provider')->nullable();
            $table->string('tls_certificate')->nullable();
            $table->unsignedSmallInteger('external_port')->nullable();
            $table->string('exposure_type')->nullable();
            $table->string('publication_owner')->nullable();
            $table->text('internet_notes')->nullable();

            // Monitoring and operations
            $table->boolean('monitoring_enabled')->default(false);
            $table->string('monitoring_tool')->nullable();
            $table->boolean('logging_enabled')->default(false);
            $table->string('logging_platform')->nullable();
            $table->string('apm_tool')->nullable();
            $table->text('dashboard_url')->nullable();
            $table->text('health_check_url')->nullable();
            $table->string('support_team')->nullable();
            $table->string('operations_owner')->nullable();
            $table->string('on_call_group')->nullable();
            $table->text('runbook_url')->nullable();
            $table->text('documentation_url')->nullable();
            $table->text('repository_url')->nullable();
            $table->text('cicd_pipeline_url')->nullable();
            $table->boolean('backup_enabled')->default(false);
            $table->boolean('disaster_recovery_enabled')->default(false);
            $table->string('disaster_recovery_environment')->nullable();
            $table->string('rpo')->nullable();
            $table->string('rto')->nullable();
            $table->text('operational_notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['application_id', 'environment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_environments');
    }
};
