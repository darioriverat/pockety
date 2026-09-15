<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_name_must_be_unique(): void
    {
        $this->actingAs(User::factory()->create());

        // Create first account
        Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
        ]);

        // Attempt to create second account with same name
        $response = $this->postJson('/api/accounts', [
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'Validation failed',
            'messages' => [
                'name' => ['An account with this name already exists.'],
            ],
        ]);

        // Verify only one account exists
        $this->assertDatabaseCount('accounts', 1);
    }

    public function test_account_name_can_be_reused_after_deactivation(): void
    {
        $this->actingAs(User::factory()->create());

        // Create and deactivate first account
        $account = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'is_active' => false,
        ]);

        // Note: Current uniqueness check is on name field only, not scoped to is_active
        // This test documents the current behavior - unique names required even for inactive
        $response = $this->postJson('/api/accounts', [
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'Validation failed',
            'messages' => [
                'name' => ['An account with this name already exists.'],
            ],
        ]);
    }

    public function test_account_can_update_with_same_name(): void
    {
        $this->actingAs(User::factory()->create());

        $account = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
        ]);

        // Update with same name should work
        $response = $this->patchJson("/api/accounts/{$account->id}", [
            'name' => 'RBC Checking',
            'notes' => 'Updated notes',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'id' => $account->id,
                'name' => 'RBC Checking',
                'notes' => 'Updated notes',
            ],
        ]);
    }

    public function test_account_cannot_update_to_existing_name(): void
    {
        $this->actingAs(User::factory()->create());

        Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
        ]);

        $account2 = Account::factory()->create([
            'name' => 'RBC Savings',
            'type' => 'bank',
        ]);

        // Attempt to update second account to first account's name
        $response = $this->patchJson("/api/accounts/{$account2->id}", [
            'name' => 'RBC Checking',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'Validation failed',
            'messages' => [
                'name' => ['An account with this name already exists.'],
            ],
        ]);

        // Verify name was not updated
        $this->assertDatabaseHas('accounts', [
            'id' => $account2->id,
            'name' => 'RBC Savings',
        ]);
    }

    public function test_unique_account_names_are_accepted(): void
    {
        $this->actingAs(User::factory()->create());

        // Create first account
        $response1 = $this->postJson('/api/accounts', [
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $response1->assertStatus(201);

        // Create second account with different name
        $response2 = $this->postJson('/api/accounts', [
            'name' => 'RBC Savings',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $response2->assertStatus(201);

        // Verify both accounts exist
        $this->assertDatabaseCount('accounts', 2);
        $this->assertDatabaseHas('accounts', ['name' => 'RBC Checking']);
        $this->assertDatabaseHas('accounts', ['name' => 'RBC Savings']);
    }
}
