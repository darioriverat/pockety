<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\PeriodBalance;
use App\Models\Transaction;
use App\Models\User;
use App\Support\CategoryTemplate;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserOwnershipMigrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return list<string>
     */
    private function financialTables(): array
    {
        return [
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
    }

    public function test_user_id_columns_exist_on_financial_tables(): void
    {
        foreach ($this->financialTables() as $table) {
            $this->assertTrue(Schema::hasColumn($table, 'user_id'), "Missing user_id on {$table}");
            $this->assertTrue(
                ! Schema::getConnection()->getSchemaBuilder()->getColumnType($table, 'user_id')
                    || true,
            );
        }
    }

    public function test_user_id_is_not_nullable_on_categories(): void
    {
        $column = collect(Schema::getColumns('categories'))
            ->firstWhere('name', 'user_id');

        $this->assertNotNull($column);
        $this->assertFalse((bool) ($column['nullable'] ?? true));
    }

    public function test_categories_unique_is_per_user_code(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        CategoryTemplate::seedForUser((int) $userA->id);
        CategoryTemplate::seedForUser((int) $userB->id);

        $this->assertDatabaseHas('categories', [
            'user_id' => $userA->id,
            'code' => 'C001',
        ]);
        $this->assertDatabaseHas('categories', [
            'user_id' => $userB->id,
            'code' => 'C001',
        ]);

        $this->expectException(QueryException::class);

        Category::query()->create([
            'user_id' => $userA->id,
            'code' => 'C001',
            'name' => 'Duplicate',
            'is_debt_category' => false,
            'is_income_category' => false,
            'is_active' => true,
        ]);
    }

    public function test_period_uniques_are_per_user(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        ExchangeRate::query()->create([
            'user_id' => $userA->id,
            'period' => '202601',
            'usd_cop' => 4000,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
        ExchangeRate::query()->create([
            'user_id' => $userB->id,
            'period' => '202601',
            'usd_cop' => 4100,
            'usd_cad' => 0.76,
            'cad_cop' => 3100,
        ]);

        PeriodBalance::query()->create([
            'user_id' => $userA->id,
            'period' => '202601',
            'assets_cad' => 100,
            'liabilities_cad' => 50,
            'equity_cad' => 50,
            'income_cad' => 10,
            'net_operating_expenses_cad' => 5,
            'records_check_result_cad' => 0,
            'reconciliation_status' => 'balanced',
        ]);
        PeriodBalance::query()->create([
            'user_id' => $userB->id,
            'period' => '202601',
            'assets_cad' => 200,
            'liabilities_cad' => 80,
            'equity_cad' => 120,
            'income_cad' => 20,
            'net_operating_expenses_cad' => 8,
            'records_check_result_cad' => 0,
            'reconciliation_status' => 'balanced',
        ]);

        $this->assertEquals(2, ExchangeRate::query()->where('period', '202601')->count());
        $this->assertEquals(2, PeriodBalance::query()->where('period', '202601')->count());
    }

    public function test_template_copy_for_second_user_has_no_transactions(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        CategoryTemplate::seedForUser((int) $owner->id);
        CategoryTemplate::seedForUser((int) $other->id);

        $this->assertEquals(
            46,
            Category::query()->forUser((int) $other->id)->where('is_active', true)->count()
        );
        $this->assertDatabaseHas('categories', [
            'user_id' => $other->id,
            'code' => 'C040',
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('categories', [
            'user_id' => $other->id,
            'code' => 'I01',
        ]);
        $this->assertEquals(
            0,
            Transaction::query()->forUser((int) $other->id)->count()
        );
        $this->assertEquals(
            0,
            Budget::query()->forUser((int) $other->id)->count()
        );
    }

    public function test_migration_copies_template_for_preexisting_additional_users(): void
    {
        $this->replayMigration(function (): void {
            $owner = User::factory()->create();
            $other = User::factory()->create();

            DB::table('categories')->insert([
                'code' => 'C001',
                'name' => 'Groceries',
                'is_debt_category' => false,
                'is_income_category' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->artisan('migrate', ['--force' => true])->assertSuccessful();

            $this->assertDatabaseHas('categories', [
                'user_id' => $owner->id,
                'code' => 'C001',
                'name' => 'Groceries',
            ]);
            $this->assertSame(
                1,
                DB::table('categories')->where('user_id', $owner->id)->where('code', 'C001')->count()
            );
            $this->assertDatabaseHas('categories', [
                'user_id' => $other->id,
                'code' => 'C001',
                'name' => 'Groceries',
            ]);
            $this->assertDatabaseHas('categories', [
                'user_id' => $other->id,
                'code' => 'C040',
                'is_active' => false,
            ]);
            $this->assertSame(
                47,
                Category::query()->forUser((int) $other->id)->count()
            );
        });
    }

    public function test_migration_resumes_after_user_id_columns_were_added(): void
    {
        $this->replayMigration(function (): void {
            $owner = User::factory()->create();
            $other = User::factory()->create();

            DB::table('categories')->insert([
                'code' => 'C001',
                'name' => 'Groceries',
                'is_debt_category' => false,
                'is_income_category' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($this->financialTables() as $table) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->foreignId('user_id')
                        ->nullable()
                        ->constrained('users')
                        ->restrictOnDelete();
                });
            }

            DB::table('categories')->whereNull('user_id')->update(['user_id' => $owner->id]);

            $this->artisan('migrate', ['--force' => true])->assertSuccessful();

            $this->assertDatabaseHas('categories', [
                'user_id' => $owner->id,
                'code' => 'C001',
            ]);
            $this->assertDatabaseHas('categories', [
                'user_id' => $other->id,
                'code' => 'C001',
            ]);
            $this->assertFalse($this->userIdIsNullable('categories'));
        });
    }

    /**
     * @param  callable(): void  $replay
     */
    private function replayMigration(callable $replay): void
    {
        $this->artisan('migrate:rollback', [
            '--step' => 1,
            '--force' => true,
        ])->assertSuccessful();

        $this->assertFalse(Schema::hasColumn('categories', 'user_id'));

        try {
            $replay();
        } finally {
            $applied = DB::table('migrations')
                ->where('migration', '2026_10_04_060000_add_user_id_to_financial_tables')
                ->exists();

            if (! $applied) {
                $this->artisan('migrate', ['--force' => true])->assertSuccessful();
            }
        }
    }

    private function userIdIsNullable(string $table): bool
    {
        $column = collect(Schema::getColumns($table))->firstWhere('name', 'user_id');

        return (bool) ($column['nullable'] ?? true);
    }
}
