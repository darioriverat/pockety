<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('is_income_category')->default(false)->after('is_debt_category');
        });

        DB::table('categories')->updateOrInsert(
            ['code' => 'I01'],
            [
                'name_es' => 'SALARIO',
                'name_en' => 'Salary',
                'is_debt_category' => false,
                'is_income_category' => true,
                'is_active' => true,
                'status' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('categories')->where('code', 'I01')->delete();

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('is_income_category');
        });
    }
};
