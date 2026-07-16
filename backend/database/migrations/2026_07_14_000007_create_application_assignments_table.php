<?php

declare(strict_types=1);

use Database\Support\OpenAssignmentConstraint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            // RESTRICT keeps behaviour consistent across engines. On MySQL/MariaDB this is
            // also required because user_id backs the generated open_key column.
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('app_role_id')->constrained()->restrictOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('assigned_at');
            $table->timestamp('ended_at')->nullable();
            $table->boolean('is_primary')->default(false)->index();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('ended_at');
            $table->index('assigned_at');
        });

        // Enforces one OPEN assignment per (application_id, user_id) on MySQL and MSSQL.
        OpenAssignmentConstraint::create();
    }

    public function down(): void
    {
        Schema::dropIfExists('application_assignments');
    }
};
