<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Child tables created by this migration, in creation order. The reverse of
     * this list is used when rolling back so foreign keys are dropped safely.
     *
     * @var list<string>
     */
    private array $tables = [
        'application_servers',
        'application_databases',
        'application_networks',
        'application_dns_records',
        'application_listeners',
        'application_load_balancers',
        'application_integrations',
        'application_message_brokers',
        'application_storage_resources',
    ];

    public function up(): void
    {
        Schema::create('application_servers', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('server_name')->nullable();
            $table->string('node_name')->nullable();
            $table->string('private_ip', 45)->nullable();
            $table->string('public_ip', 45)->nullable();
            $table->string('management_ip', 45)->nullable();
            $table->string('operating_system')->nullable();
            $table->string('server_role')->nullable();
            $table->string('cpu')->nullable();
            $table->string('memory')->nullable();
            $table->string('storage')->nullable();
            $table->string('vm_name')->nullable();
            $table->string('hostname')->nullable();
            $table->string('availability_zone')->nullable();
            $table->string('status')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_databases', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('database_name')->nullable();
            $table->string('database_type')->nullable();
            $table->string('database_engine')->nullable();
            $table->string('database_version')->nullable();
            $table->string('database_role', 30)->nullable();
            $table->string('cluster_name')->nullable();
            $table->string('cluster_ip', 45)->nullable();
            $table->string('hostname')->nullable();
            $table->string('private_ip', 45)->nullable();
            $table->unsignedSmallInteger('port')->nullable();
            $table->string('instance_name')->nullable();
            $table->string('service_name')->nullable();
            $table->string('database_schema')->nullable();
            $table->string('ha_model')->nullable();
            $table->string('read_write_role')->nullable();
            $table->string('connection_type')->nullable();
            $table->string('backup_policy')->nullable();
            $table->string('database_owner')->nullable();
            $table->string('secret_reference')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_networks', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('network_name')->nullable();
            $table->string('network_type')->nullable();
            $table->string('network_ip', 45)->nullable();
            $table->string('cidr', 60)->nullable();
            $table->string('subnet')->nullable();
            $table->string('vlan')->nullable();
            $table->string('security_zone')->nullable();
            $table->string('source_network')->nullable();
            $table->string('destination_network')->nullable();
            $table->string('protocol', 30)->nullable();
            $table->unsignedSmallInteger('port')->nullable();
            $table->string('firewall_requirement')->nullable();
            $table->string('network_route')->nullable();
            $table->string('gateway', 45)->nullable();
            $table->string('dns_server', 45)->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_dns_records', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('dns_name')->nullable();
            $table->string('fqdn')->nullable();
            $table->string('record_type', 20)->nullable();
            $table->string('dns_scope', 20)->nullable();
            $table->string('target')->nullable();
            $table->unsignedSmallInteger('port')->nullable();
            $table->string('protocol', 30)->nullable();
            $table->boolean('tls_enabled')->default(false);
            $table->string('certificate_name')->nullable();
            $table->date('certificate_expires_at')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_listeners', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('listener_name')->nullable();
            $table->string('listener_ip', 45)->nullable();
            $table->unsignedSmallInteger('port')->nullable();
            $table->string('protocol', 30)->nullable();
            $table->boolean('tls_enabled')->default(false);
            $table->string('certificate_reference')->nullable();
            $table->string('backend_pool')->nullable();
            $table->string('health_check_path')->nullable();
            $table->unsignedSmallInteger('health_check_port')->nullable();
            $table->string('health_check_protocol', 30)->nullable();
            $table->text('persistence_config')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_load_balancers', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('lb_type', 30)->nullable();
            $table->string('lb_name')->nullable();
            $table->string('f5_partition')->nullable();
            $table->string('vip_name')->nullable();
            $table->string('vip_ip', 45)->nullable();
            $table->string('vip_visibility', 20)->nullable();
            $table->unsignedSmallInteger('listener_port')->nullable();
            $table->string('protocol', 30)->nullable();
            $table->string('pool_name')->nullable();
            $table->text('pool_members')->nullable();
            $table->string('health_monitor')->nullable();
            $table->string('ssl_profile')->nullable();
            $table->string('persistence_profile')->nullable();
            $table->string('lb_method')->nullable();
            $table->string('active_standby_status')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_integrations', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('integration_name')->nullable();
            $table->string('source_system')->nullable();
            $table->string('destination_system')->nullable();
            $table->string('direction', 20)->nullable();
            $table->text('api_url')->nullable();
            $table->string('api_gateway')->nullable();
            $table->string('protocol', 30)->nullable();
            $table->unsignedSmallInteger('port')->nullable();
            $table->string('authentication_type')->nullable();
            $table->string('data_classification')->nullable();
            $table->unsignedInteger('timeout')->nullable();
            $table->string('retry_policy')->nullable();
            $table->string('owner')->nullable();
            $table->string('secret_reference')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_message_brokers', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('broker_name')->nullable();
            $table->string('broker_type')->nullable();
            $table->string('cluster_name')->nullable();
            $table->text('broker_url')->nullable();
            $table->string('topic')->nullable();
            $table->string('queue')->nullable();
            $table->string('consumer_group')->nullable();
            $table->unsignedSmallInteger('port')->nullable();
            $table->boolean('tls_enabled')->default(false);
            $table->string('owner')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });

        Schema::create('application_storage_resources', function (Blueprint $table): void {
            $this->addOwnerColumns($table);
            $table->string('storage_name')->nullable();
            $table->string('storage_type')->nullable();
            $table->text('storage_endpoint')->nullable();
            $table->string('mount_path')->nullable();
            $table->string('capacity')->nullable();
            $table->string('replication')->nullable();
            $table->boolean('backup_enabled')->default(false);
            $table->string('retention_period')->nullable();
            $table->string('owner')->nullable();
            $table->text('notes')->nullable();
            $this->addAuditColumns($table);
        });
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $table) {
            Schema::dropIfExists($table);
        }
    }

    /**
     * Primary key plus the owning environment profile foreign key.
     */
    private function addOwnerColumns(Blueprint $table): void
    {
        $table->id();
        $table->foreignId('application_environment_id')
            ->constrained('application_environments')
            ->cascadeOnDelete();
    }

    /**
     * Ordering, ownership tracking, timestamps and soft deletes.
     */
    private function addAuditColumns(Blueprint $table): void
    {
        $table->unsignedInteger('sort_order')->default(0);
        $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
        $table->timestamps();
        $table->softDeletes();

        // Explicit short name — auto-generated names exceed MySQL's 64-char limit.
        $table->index(
            ['application_environment_id', 'sort_order'],
            $table->getTable().'_env_sort_idx'
        );
    }
};
