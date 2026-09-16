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
        if (Schema::hasTable('variance_acknowledgments')) {
            return;
        }

        Schema::create('variance_acknowledgments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('period', 6); // YYYYMM
            $table->text('note')->nullable();
            $table->timestamp('acknowledged_at');
            $table->timestamps();

            $table->unique(['account_id', 'period']);
            $table->index('period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variance_acknowledgments');
    }
};
