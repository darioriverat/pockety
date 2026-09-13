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
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('period', 6); // YYYYMM format (e.g., '202501')
            $table->decimal('usd_cop', 10, 4); // USD to COP rate (e.g., 4400)
            $table->decimal('usd_cad', 10, 4); // USD to CAD rate (e.g., 0.75)
            $table->decimal('cad_cop', 10, 4); // CAD to COP rate (COP per 1 CAD, e.g., 3000)
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
        Schema::dropIfExists('exchange_rates');
    }
};
