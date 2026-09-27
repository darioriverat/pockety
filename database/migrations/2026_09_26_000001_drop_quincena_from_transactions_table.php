<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the pay-period half. Period and the transaction date already record when it happened.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['period', 'quincena']);
            $table->dropColumn('quincena');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('quincena', ['Q1', 'Q2'])->default('Q1')->after('period');
            $table->index(['period', 'quincena']);
        });
    }
};
