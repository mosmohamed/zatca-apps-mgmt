<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['slack', 'job_title']);
            $table->foreignId('job_title_id')->nullable()->after('extension')->constrained('job_titles')->nullOnDelete();
            $table->index('job_title_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('job_title_id');
            $table->string('slack')->nullable();
            $table->string('job_title')->nullable();
        });
    }
};
