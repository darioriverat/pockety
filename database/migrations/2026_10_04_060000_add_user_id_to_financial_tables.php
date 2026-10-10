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
        } else {
            // Spec: skip backfill when users are empty. Drop any orphan financial
            // rows so the column can become NOT NULL; seeders assign user_id later.
            foreach ($this->tables as $table) {
                DB::table($table)->whereNull('user_id')->delete();
            }
        }

        // Release global codes before copying the template. MySQL still has
        // categories_code_unique at this point, so a second user's C001 cannot
        // be inserted until that index is gone. Composite uniques are added
        // after user_id is NOT NULL so the column change does not drop them.
        $this->dropUniqueIndex('categories', 'categories_code_unique', ['code']);
        $this->dropUniqueIndex('exchange_rates', 'exchange_rates_period_unique', ['period']);
        $this->dropUniqueIndex('historical_balance_sheets', 'historical_balance_sheets_period_unique', ['period']);
        $this->dropUniqueIndex('period_balances', 'period_balances_period_unique', ['period']);

        if ($ownerId !== null) {
            $otherUserIds = DB::table('users')
                ->where('id', '!=', $ownerId)
                ->orderBy('id')
                ->pluck('id');

            foreach ($otherUserIds as $userId) {
                CategoryTemplate::seedForUser((int) $userId);
            }
        }

        $this->makeUserIdColumnsNotNullable();

        $this->addUniqueIndex('categories', ['user_id', 'code']);
        $this->addUniqueIndex('exchange_rates', ['user_id', 'period']);
        $this->addUniqueIndex('historical_balance_sheets', ['user_id', 'period']);
        $this->addUniqueIndex('period_balances', ['user_id', 'period']);
    }

    private function addNullableUserIdColumns(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'user_id')) {
                continue;
            }

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
            if (! $this->columnIsNullable($table, 'user_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->unsignedBigInteger('user_id')->nullable(false)->change();
            });
        }
    }

    private function columnIsNullable(string $table, string $column): bool
    {
        $definition = collect(Schema::getColumns($table))->firstWhere('name', $column);

        return (bool) ($definition['nullable'] ?? true);
    }

    /**
     * @param  list<string>  $columns
     */
    private function dropUniqueIndex(string $table, string $indexName, array $columns): void
    {
        if (! $this->uniqueIndexExists($table, $indexName, $columns)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns) {
            $blueprint->dropUnique($columns);
        });
    }

    /**
     * @param  list<string>  $columns
     */
    private function addUniqueIndex(string $table, array $columns): void
    {
        $indexName = $table.'_'.implode('_', $columns).'_unique';

        if ($this->uniqueIndexExists($table, $indexName, $columns)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns) {
            $blueprint->unique($columns);
        });
    }

    /**
     * @param  list<string>  $columns
     */
    private function uniqueIndexExists(string $table, string $indexName, array $columns): bool
    {
        $indexes = Schema::getConnection()->getSchemaBuilder()->getIndexes($table);

        foreach ($indexes as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }

            if ($index['unique'] && $index['columns'] === $columns) {
                return true;
            }
        }

        return false;
    }

    public function down(): void
    {
        $this->restoreSingleColumnUnique('categories', ['user_id', 'code'], 'code');
        $this->restoreSingleColumnUnique('exchange_rates', ['user_id', 'period'], 'period');
        $this->restoreSingleColumnUnique('historical_balance_sheets', ['user_id', 'period'], 'period');
        $this->restoreSingleColumnUnique('period_balances', ['user_id', 'period'], 'period');

        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'user_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropConstrainedForeignId('user_id');
                });
            }
        }
    }

    /**
     * MySQL binds the user_id foreign key to the composite unique index, so that
     * index cannot be dropped until the foreign key is released.
     *
     * @param  list<string>  $compositeColumns
     */
    private function restoreSingleColumnUnique(string $table, array $compositeColumns, string $column): void
    {
        $compositeName = $table.'_'.implode('_', $compositeColumns).'_unique';

        if (! $this->uniqueIndexExists($table, $compositeName, $compositeColumns)) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $this->dropUserIdForeignKey($table);
        }

        Schema::table($table, function (Blueprint $blueprint) use ($compositeColumns, $column) {
            $blueprint->dropUnique($compositeColumns);
            $blueprint->unique($column);
        });

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            });
        }
    }

    private function dropUserIdForeignKey(string $table): void
    {
        foreach (Schema::getForeignKeys($table) as $foreignKey) {
            if ($foreignKey['columns'] !== ['user_id'] || $foreignKey['name'] === null) {
                continue;
            }

            $name = $foreignKey['name'];

            Schema::table($table, function (Blueprint $blueprint) use ($name) {
                $blueprint->dropForeign($name);
            });
        }
    }
};
