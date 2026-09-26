<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Variance acknowledgments hid differences that should stay visible.
     */
    public function up(): void
    {
        Schema::dropIfExists('variance_acknowledgments');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('variance_acknowledgments')) {
            return;
        }

        Schema::create('variance_acknowledgments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('period', 6);
            $table->text('note')->nullable();
            $table->timestamp('acknowledged_at');
            $table->timestamps();

            $table->unique(['account_id', 'period']);
            $table->index('period');
        });
    }
};
