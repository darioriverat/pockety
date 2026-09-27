<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Collapse bilingual category names to a single English name.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->renameColumn('name_en', 'name');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('name_es');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('category_language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('category_language', 2)->default('en')->after('default_currency');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('name_es')->default('')->after('code');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->renameColumn('name', 'name_en');
        });
    }
};
