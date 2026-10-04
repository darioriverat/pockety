<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccountBalance>
 */
class AccountBalanceFactory extends Factory
{
    protected $model = AccountBalance::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'account_id' => null,
            'period' => '202601',
            'recorded_balance_cad' => fake()->randomFloat(2, 0, 10000),
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
            'notes' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (AccountBalance $balance): void {
            if ($balance->account_id !== null) {
                return;
            }

            $userId = $balance->user_id instanceof User ? $balance->user_id->id : $balance->user_id;
            $balance->account_id = Account::factory()->create(['user_id' => $userId])->id;
        });
    }
}
