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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // Transaction date
            $table->string('period', 6); // YYYYMM format (e.g., '202501')
            $table->enum('quincena', ['Q1', 'Q2']); // Pay period half
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict'); // Category reference
            $table->foreignId('account_id')->nullable()->constrained('accounts')->onDelete('restrict'); // Account reference

            // Multi-currency amounts - only ONE should be non-null per transaction
            $table->decimal('amount_cad', 15, 2)->nullable();
            $table->decimal('amount_usd', 15, 2)->nullable();
            $table->decimal('amount_cop', 15, 2)->nullable();

            $table->text('comments')->nullable(); // Free-text memo
            $table->boolean('is_recurring')->default(false); // Recurring expense flag
            $table->enum('debt_component', ['principal', 'interest'])->nullable(); // For debt payment transactions

            $table->timestamps();

            // Indexes for common queries
            $table->index('date');
            $table->index('period');
            $table->index(['period', 'quincena']);
            $table->index('category_id');
            $table->index('account_id');
            $table->index('is_recurring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
