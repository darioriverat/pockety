<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // e.g., C001, C002, ...
            $table->string('name_es'); // Spanish name
            $table->string('name_en'); // English name
            $table->boolean('is_debt_category')->default(false); // True for debt payment categories
            $table->boolean('is_active')->default(true); // False for retired categories like C040
            $table->string('status')->nullable(); // e.g., 'retired_merged_into_C031'
            $table->timestamps();

            $table->index('code');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
