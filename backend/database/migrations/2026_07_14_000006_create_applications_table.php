<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->noActionOnDelete();
            $table->foreignId('application_type_id')->constrained()->noActionOnDelete();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('code')->unique();
            $table->string('status')->default('Active')->index();
            $table->string('criticality')->default('Medium')->index();
            $table->string('business_owner')->nullable();
            $table->string('technical_owner')->nullable();
            $table->string('support_type')->default('Business Hours');
            $table->string('documentation_url')->nullable();
            $table->string('repository_url')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name_ar');
            $table->index('name_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
