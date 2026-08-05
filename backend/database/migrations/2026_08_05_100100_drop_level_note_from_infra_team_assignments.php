<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('infra_team_assignments')) {
            return;
        }

        if (! Schema::hasColumn('infra_team_assignments', 'level_note')) {
            return;
        }

        Schema::table('infra_team_assignments', function (Blueprint $table): void {
            $table->dropColumn('level_note');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('infra_team_assignments')) {
            return;
        }

        if (Schema::hasColumn('infra_team_assignments', 'level_note')) {
            return;
        }

        Schema::table('infra_team_assignments', function (Blueprint $table): void {
            $table->string('level_note')->nullable();
        });
    }
};
