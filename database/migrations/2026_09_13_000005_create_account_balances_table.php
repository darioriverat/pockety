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
        Schema::create('account_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('period', 6); // YYYYMM format

            // Recorded balances (manually entered from bank statements)
            $table->decimal('recorded_balance_cad', 15, 2)->nullable()->default(0);
            $table->decimal('recorded_balance_usd', 15, 2)->nullable()->default(0);
            $table->decimal('recorded_balance_cop', 15, 2)->nullable()->default(0);

            $table->text('notes')->nullable(); // Optional notes about this balance
            $table->timestamps();

            // Each account can only have one balance record per period
            $table->unique(['account_id', 'period']);
            $table->index('period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_balances');
    }
};
