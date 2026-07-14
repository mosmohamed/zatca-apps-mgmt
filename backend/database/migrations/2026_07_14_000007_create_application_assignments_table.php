<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            // MySQL forbids CASCADE/SET NULL on the base column of a stored generated
            // column, and user_id backs the open_key column below, so this stays RESTRICT.
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('app_role_id')->constrained()->restrictOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('assigned_at');
            $table->timestamp('ended_at')->nullable();

            // Generated helper column that enforces "one OPEN assignment per user+application".
            // When ended_at IS NULL (assignment is open) it mirrors user_id; otherwise it is NULL.
            // Because engines treat NULLs as distinct in unique indexes, closed rows never collide,
            // while open rows are constrained to be unique per (application_id, user_id).
            $table->unsignedBigInteger('open_key')
                ->storedAs('CASE WHEN ended_at IS NULL THEN user_id ELSE NULL END');

            $table->boolean('is_primary')->default(false)->index();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['application_id', 'open_key'], 'uq_open_assignment_per_app');
            $table->index('ended_at');
            $table->index('assigned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_assignments');
    }
};
