<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Support\CategoryTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionCreditTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        CategoryTemplate::seedForUser((int) $this->user->id);

        $this->groceries = Category::query()
            ->forUser((int) $this->user->id)
            ->where('code', 'C001')
            ->firstOrFail();
    }

    public function test_credit_is_allowed_on_each_asset_account_type(): void
    {
        foreach (['bank', 'investment', 'receivable'] as $type) {
            $account = $this->createAccount(ucfirst($type).' account', $type);

            $response = $this->postJson('/api/transactions', $this->payload([
                'account_id' => $account->id,
                'is_credit' => true,
                'comments' => "credit-{$type}",
            ]));

            $response->assertCreated()
                ->assertJsonPath('data.is_credit', true)
                ->assertJsonPath('data.account_id', $account->id);
        }
    }

    public function test_credit_is_rejected_on_a_liability_account(): void
    {
        $liability = $this->createAccount('Visa', 'liability');

        $response = $this->postJson('/api/transactions', $this->payload([
            'account_id' => $liability->id,
            'is_credit' => true,
        ]));

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Credit transactions can only be recorded on an asset account.');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_credit_is_rejected_without_an_account(): void
    {
        $response = $this->postJson('/api/transactions', $this->payload([
            'is_credit' => true,
        ]));

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Credit transactions can only be recorded on an asset account.');
    }

    public function test_a_regular_charge_on_a_liability_is_still_allowed(): void
    {
        $liability = $this->createAccount('Visa', 'liability');

        $response = $this->postJson('/api/transactions', $this->payload([
            'account_id' => $liability->id,
            'is_credit' => false,
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.is_credit', false)
            ->assertJsonPath('data.account_id', $liability->id);
    }

    public function test_moving_a_credit_onto_a_liability_is_rejected(): void
    {
        $bank = $this->createAccount('RBC Checking', 'bank');
        $liability = $this->createAccount('Visa', 'liability');

        $created = $this->postJson('/api/transactions', $this->payload([
            'account_id' => $bank->id,
            'is_credit' => true,
        ]));
        $created->assertCreated();

        $response = $this->putJson('/api/transactions/'.$created->json('data.id'), [
            'date' => '2025-02-20',
            'period' => '202502',
            'category_id' => $this->groceries->id,
            'account_id' => $liability->id,
            'amount_cad' => 25,
            'is_credit' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Credit transactions can only be recorded on an asset account.');

        $this->assertSame($bank->id, Transaction::query()->find($created->json('data.id'))->account_id);
    }

    public function test_clearing_the_account_on_a_credit_is_rejected(): void
    {
        $bank = $this->createAccount('RBC Checking', 'bank');

        $created = $this->postJson('/api/transactions', $this->payload([
            'account_id' => $bank->id,
            'is_credit' => true,
        ]));
        $created->assertCreated();

        $this->putJson('/api/transactions/'.$created->json('data.id'), [
            'date' => '2025-02-20',
            'period' => '202502',
            'category_id' => $this->groceries->id,
            'account_id' => null,
            'amount_cad' => 25,
            'is_credit' => true,
        ])->assertStatus(422)
            ->assertJsonPath('error', 'Credit transactions can only be recorded on an asset account.');
    }

    public function test_duplicate_keeps_a_credit_on_an_asset_account(): void
    {
        $bank = $this->createAccount('RBC Checking', 'bank');
        $source = Transaction::create([
            'date' => '2025-02-20',
            'period' => '202502',
            'category_id' => $this->groceries->id,
            'account_id' => $bank->id,
            'amount_cad' => 25,
            'is_credit' => true,
            'comments' => 'source-credit',
        ]);

        $response = $this->postJson("/api/transactions/{$source->id}/duplicate");

        $response->assertCreated()
            ->assertJsonPath('data.is_credit', true)
            ->assertJsonPath('data.account_id', $bank->id);

        $this->assertNotSame($source->id, $response->json('data.id'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date' => '2025-02-20',
            'period' => '202502',
            'category_id' => $this->groceries->id,
            'amount_cad' => 25,
            'comments' => 'grocery-refund',
        ], $overrides);
    }

    private function createAccount(string $name, string $type): Account
    {
        return Account::create([
            'name' => $name,
            'type' => $type,
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);
    }
}
