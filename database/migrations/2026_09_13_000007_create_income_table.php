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
        Schema::create('income', function (Blueprint $table) {
            $table->id();
            $table->string('period', 6); // YYYYMM format
            $table->string('description'); // e.g., "Salary - Main Job", "Refund", etc.
            $table->integer('line_number')->default(1); // 1-6, for ordering (up to 6 line items per month)

            // Multi-currency amounts - can have multiple currencies per line item
            $table->decimal('amount_cad', 15, 2)->nullable()->default(0);
            $table->decimal('amount_usd', 15, 2)->nullable()->default(0);
            $table->decimal('amount_cop', 15, 2)->nullable()->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('period');
            $table->index(['period', 'line_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('income');
    }
};
