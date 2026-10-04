<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => null,
            'account_id' => null,
            'amount_cad' => fake()->randomFloat(2, 1, 500),
            'amount_usd' => 0,
            'amount_cop' => 0,
            'comments' => null,
            'is_recurring' => false,
            'is_credit' => false,
            'is_debt_payment' => false,
            'debt_component' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Transaction $transaction): void {
            if ($transaction->category_id !== null) {
                return;
            }

            $userId = $transaction->user_id;
            if ($userId instanceof User) {
                $userId = $userId->id;
            }

            $transaction->category_id = Category::factory()->create([
                'user_id' => $userId,
            ])->id;
        });
    }
}
