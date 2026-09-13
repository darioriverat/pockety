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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "RBC Checking", "CIBC Credit Card"
            $table->enum('type', ['bank', 'investment', 'liability', 'receivable']); // Account type
            $table->enum('primary_currency', ['CAD', 'USD', 'COP'])->nullable(); // Main currency
            $table->text('notes')->nullable(); // Additional notes
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
