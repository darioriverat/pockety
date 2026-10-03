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
        Schema::create('period_balances', function (Blueprint $table) {
            $table->id();
            $table->string('period', 6);
            $table->decimal('assets_cad', 16, 2);
            $table->decimal('liabilities_cad', 16, 2);
            $table->decimal('equity_cad', 16, 2);
            $table->decimal('income_cad', 16, 2);
            $table->decimal('net_operating_expenses_cad', 16, 2);
            $table->decimal('records_check_result_cad', 16, 2);
            $table->string('reconciliation_status', 32);
            $table->timestamps();

            $table->unique('period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('period_balances');
    }
};
