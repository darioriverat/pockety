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
        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Ford Escape"
            $table->text('description')->nullable();
            $table->date('acquisition_date')->nullable();
            $table->decimal('initial_value_cad', 15, 2)->nullable(); // Initial purchase price
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });

        // Table for tracking asset book values per period
        Schema::create('fixed_asset_valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fixed_asset_id')->constrained('fixed_assets')->onDelete('cascade');
            $table->string('period', 6); // YYYYMM format
            $table->decimal('book_value_cad', 15, 2); // Book value for this period
            $table->decimal('depreciation_cad', 15, 2)->nullable()->default(0); // Depreciation this period
            $table->timestamps();

            $table->unique(['fixed_asset_id', 'period']);
            $table->index('period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fixed_asset_valuations');
        Schema::dropIfExists('fixed_assets');
    }
};
