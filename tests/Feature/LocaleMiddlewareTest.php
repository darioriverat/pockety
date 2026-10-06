<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Tests\TestCase;

class LocaleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_web_request_sets_locale_from_user(): void
    {
        $user = User::factory()->create(['locale' => 'es']);

        $this->actingAs($user)
            ->get(route('preferences.index'))
            ->assertOk();

        $this->assertSame('es', App::getLocale());
    }

    public function test_guest_web_request_stays_on_english(): void
    {
        $this->get(route('login'))->assertOk();

        $this->assertSame('en', App::getLocale());
    }

    public function test_authenticated_api_request_sets_locale_before_validation(): void
    {
        $user = User::factory()->create(['locale' => 'es']);
        $account = Account::factory()->create([
            'user_id' => $user->id,
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        Transaction::factory()->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
        ]);

        $response = $this->actingAs($user)
            ->putJson("/api/accounts/{$account->id}", [
                'name' => $account->name,
                'type' => 'investment',
                'primary_currency' => 'CAD',
                'notes' => null,
                'is_active' => true,
            ]);

        $response->assertStatus(422);
        $message = $response->json('messages.type.0');
        $this->assertIsString($message);
        $this->assertStringContainsString('transacciones', $message);
    }

    public function test_inertia_auth_user_shares_locale_next_to_default_currency(): void
    {
        $user = User::factory()->create([
            'locale' => 'es',
            'default_currency' => 'USD',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.user.locale', 'es')
                ->where('auth.user.default_currency', 'USD')
            );
    }

    public function test_import_validation_422_is_spanish_for_spanish_users(): void
    {
        $user = User::factory()->create(['locale' => 'es']);

        $response = $this->actingAs($user)
            ->postJson('/api/transactions/import', [
                'file_path' => 'plan/extracted/gastos.json',
            ]);

        $response->assertStatus(422);
        $message = $response->json('errors.file.0')
            ?? $response->json('message')
            ?? collect($response->json('errors') ?? [])->flatten()->first();
        $this->assertIsString($message);
        $this->assertStringContainsString('archivo', strtolower($message));
    }
}
