<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());

        Account::factory()->create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        Account::factory()->create([
            'name' => 'Test Credit Card',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);
    }

    public function test_get_accounts_returns_list_grouped_by_type(): void
    {
        $response = $this->getJson('/api/accounts');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'grouped' => ['assets', 'liabilities'],
                'meta' => ['total'],
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('grouped.assets')));
        $this->assertGreaterThanOrEqual(1, count($response->json('grouped.liabilities')));
    }

    public function test_update_account_name_succeeds_with_transactions(): void
    {
        /** @var User */
        $user = auth()->user();

        $account = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Original Name',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $category = Category::factory()->create([
            'user_id' => $user->id,
            'code' => 'test',
            'name' => 'Test Category',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now(),
            'period' => now()->format('Ym'),
            'amount_cad' => 100.00,
        ]);

        $response = $this->putJson("/api/accounts/{$account->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk()
            ->assertJson([
                'meta' => ['message' => 'Account updated successfully'],
            ]);

        $account->refresh();
        $this->assertEquals('Updated Name', $account->name);
        $this->assertEquals('bank', $account->type);
    }

    public function test_update_account_type_fails_with_transactions(): void
    {
        /** @var User */
        $user = auth()->user();

        $account = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Account',
            'type' => 'bank',
        ]);

        $category = Category::factory()->create([
            'user_id' => $user->id,
            'code' => 'test',
            'name' => 'Test Category',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now(),
            'period' => now()->format('Ym'),
            'amount_cad' => 100.00,
        ]);

        $response = $this->putJson("/api/accounts/{$account->id}", [
            'type' => 'investment',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'error' => 'Validation failed',
                'messages' => [
                    'type' => ['The account type cannot be changed because transactions are registered for this account.'],
                ],
            ]);

        $account->refresh();
        $this->assertEquals('bank', $account->type);
    }

    public function test_update_account_type_succeeds_without_transactions(): void
    {
        /** @var User */
        $user = auth()->user();

        $account = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Account',
            'type' => 'bank',
        ]);

        $response = $this->putJson("/api/accounts/{$account->id}", [
            'type' => 'investment',
        ]);

        $response->assertOk();

        $account->refresh();
        $this->assertEquals('investment', $account->type);
    }

    public function test_update_account_other_fields_succeeds_with_transactions(): void
    {
        /** @var User */
        $user = auth()->user();

        $account = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Original Name',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'notes' => 'Original notes',
            'is_active' => true,
        ]);

        $category = Category::factory()->create([
            'user_id' => $user->id,
            'code' => 'test',
            'name' => 'Test Category',
        ]);

        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now(),
            'period' => now()->format('Ym'),
            'amount_cad' => 100.00,
        ]);

        $response = $this->putJson("/api/accounts/{$account->id}", [
            'name' => 'Updated Name',
            'primary_currency' => 'USD',
            'notes' => 'Updated notes',
            'is_active' => false,
        ]);

        $response->assertOk();

        $account->refresh();
        $this->assertEquals('Updated Name', $account->name);
        $this->assertEquals('USD', $account->primary_currency);
        $this->assertEquals('Updated notes', $account->notes);
        $this->assertFalse($account->is_active);
        $this->assertEquals('bank', $account->type);
    }

    public function test_account_name_uniqueness_is_scoped_by_user(): void
    {
        /** @var User */
        $user = auth()->user();
        $otherUser = User::factory()->create();

        Account::factory()->create([
            'user_id' => $otherUser->id,
            'name' => 'Shared Name',
            'type' => 'bank',
        ]);

        // Creating an account with the same name should succeed for a different user
        $response = $this->postJson('/api/accounts', [
            'name' => 'Shared Name',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $response->assertStatus(201);
    }

    public function test_update_account_name_uniqueness_is_scoped_by_user(): void
    {
        /** @var User */
        $user = auth()->user();
        $otherUser = User::factory()->create();

        Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Existing Name',
            'type' => 'bank',
        ]);

        $account = Account::factory()->create([
            'user_id' => $user->id,
            'name' => 'Different Name',
            'type' => 'bank',
        ]);

        // Updating to an existing name for the same user should fail
        $response = $this->putJson("/api/accounts/{$account->id}", [
            'name' => 'Existing Name',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'error' => 'Validation failed',
                'messages' => [
                    'name' => ['An account with this name already exists.'],
                ],
            ]);

        // But updating to a name that another user has should succeed
        Account::factory()->create([
            'user_id' => $otherUser->id,
            'name' => 'Other User Account',
            'type' => 'bank',
        ]);

        $response = $this->putJson("/api/accounts/{$account->id}", [
            'name' => 'Other User Account',
        ]);

        $response->assertOk();
    }
}
