<?php

use App\Support\CategoryTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<string>
     */
    private array $tables = [
        'categories',
        'accounts',
        'account_balances',
        'transactions',
        'budgets',
        'income',
        'exchange_rates',
        'fixed_assets',
        'fixed_asset_valuations',
        'historical_balance_sheets',
        'period_balances',
        'period_balance_histories',
    ];

    public function up(): void
    {
        $this->addNullableUserIdColumns();

        $ownerId = DB::table('users')->min('id');

        if ($ownerId !== null) {
            foreach ($this->tables as $table) {
                DB::table($table)->whereNull('user_id')->update(['user_id' => $ownerId]);
            }

            $otherUserIds = DB::table('users')
                ->where('id', '!=', $ownerId)
                ->orderBy('id')
                ->pluck('id');

            foreach ($otherUserIds as $userId) {
                CategoryTemplate::seedForUser((int) $userId);
            }
        } else {
            // Spec: skip backfill when users are empty. Drop any orphan financial
            // rows so the column can become NOT NULL; seeders assign user_id later.
            foreach ($this->tables as $table) {
                DB::table($table)->whereNull('user_id')->delete();
            }
        }

        $this->makeUserIdColumnsNotNullable();

        $this->replaceUniqueIndex('categories', 'categories_code_unique', ['code'], ['user_id', 'code']);
        $this->replaceUniqueIndex('exchange_rates', 'exchange_rates_period_unique', ['period'], ['user_id', 'period']);
        $this->replaceUniqueIndex('historical_balance_sheets', 'historical_balance_sheets_period_unique', ['period'], ['user_id', 'period']);
        $this->replaceUniqueIndex('period_balances', 'period_balances_period_unique', ['period'], ['user_id', 'period']);
    }

    private function addNullableUserIdColumns(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->restrictOnDelete();
            });
        }
    }

    private function makeUserIdColumnsNotNullable(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->unsignedBigInteger('user_id')->nullable(false)->change();
            });
        }
    }

    /**
     * @param  list<string>  $oldColumns
     * @param  list<string>  $newColumns
     */
    private function replaceUniqueIndex(string $table, string $oldIndexName, array $oldColumns, array $newColumns): void
    {
        Schema::table($table, function (Blueprint $blueprint) use ($table, $oldIndexName, $oldColumns, $newColumns) {
            $sm = Schema::getConnection()->getSchemaBuilder();
            $indexes = $sm->getIndexes($table);
            $indexNames = collect($indexes)->pluck('name')->all();

            if (in_array($oldIndexName, $indexNames, true)) {
                $blueprint->dropUnique($oldColumns);
            } else {
                // SQLite may name composites differently; try dropping by columns when present.
                foreach ($indexes as $index) {
                    if ($index['unique'] && $index['columns'] === $oldColumns) {
                        $blueprint->dropUnique($oldColumns);
                        break;
                    }
                }
            }

            $newName = $table.'_'.implode('_', $newColumns).'_unique';
            if (! in_array($newName, $indexNames, true)) {
                $blueprint->unique($newColumns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $blueprint) {
            $blueprint->dropUnique(['user_id', 'code']);
            $blueprint->unique('code');
        });

        Schema::table('exchange_rates', function (Blueprint $blueprint) {
            $blueprint->dropUnique(['user_id', 'period']);
            $blueprint->unique('period');
        });

        Schema::table('historical_balance_sheets', function (Blueprint $blueprint) {
            $blueprint->dropUnique(['user_id', 'period']);
            $blueprint->unique('period');
        });

        Schema::table('period_balances', function (Blueprint $blueprint) {
            $blueprint->dropUnique(['user_id', 'period']);
            $blueprint->unique('period');
        });

        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'user_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropConstrainedForeignId('user_id');
                });
            }
        }
    }
};
