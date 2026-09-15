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
        Schema::create('historical_balance_sheets', function (Blueprint $table) {
            $table->id();
            $table->string('period', 6); // YYYYMM
            $table->decimal('assets_cad', 16, 6);
            $table->decimal('liabilities_cad', 16, 6);
            $table->decimal('equity_cad', 16, 6);
            $table->unsignedInteger('source_row')->nullable();
            $table->timestamps();

            $table->unique('period');
            $table->index('period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historical_balance_sheets');
    }
};
