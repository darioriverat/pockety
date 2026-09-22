<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Identify complementary cash outflows that fund a debt payment.
     *
     * Principal/interest records allocate the payment on the liability.
     * This flag marks the matching spend on the asset account the money
     * left, so those spends can be omitted from net operating expenses.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->boolean('is_debt_payment')->default(false)->after('is_credit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('is_debt_payment');
        });
    }
};
