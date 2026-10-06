<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreferencesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'default_currency' => 'CAD',
            'locale' => 'en',
        ]);
        $this->actingAs($this->user);
    }

    public function test_guests_are_redirected_to_login()
    {
        $this->actingAs(new User);
        auth()->logout();

        $response = $this->get(route('preferences.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_preferences_page()
    {
        $response = $this->get(route('preferences.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('preferences')
            ->has('user')
            ->has('available_currencies')
            ->has('available_locales')
        );
    }

    public function test_preferences_page_shows_current_default_currency()
    {
        $this->user->update(['default_currency' => 'USD']);

        $response = $this->get(route('preferences.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('user.default_currency', 'USD')
        );
    }

    public function test_preferences_page_shows_current_locale()
    {
        $this->user->update(['locale' => 'es']);

        $response = $this->get(route('preferences.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('user.locale', 'es')
        );
    }

    public function test_user_can_update_default_currency_to_cad()
    {
        $this->user->update(['default_currency' => 'USD']);

        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'locale' => 'en',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'default_currency' => 'CAD',
        ]);
    }

    public function test_user_can_update_default_currency_to_usd()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'USD',
            'locale' => 'en',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'default_currency' => 'USD',
        ]);
    }

    public function test_user_can_update_default_currency_to_cop()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'COP',
            'locale' => 'en',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'default_currency' => 'COP',
        ]);
    }

    public function test_user_can_update_locale_to_es()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'locale' => 'es',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'locale' => 'es',
        ]);
    }

    public function test_locale_rejects_unsupported_values()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'locale' => 'fr',
        ]);

        $response->assertSessionHasErrors('locale');
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'locale' => 'en',
        ]);
    }

    public function test_locale_is_required()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'locale' => '',
        ]);

        $response->assertSessionHasErrors('locale');
    }

    public function test_default_currency_is_required()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => '',
            'locale' => 'en',
        ]);

        $response->assertSessionHasErrors('default_currency');
    }

    public function test_default_currency_must_be_valid()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'INVALID',
            'locale' => 'en',
        ]);

        $response->assertSessionHasErrors('default_currency');
    }

    public function test_available_currencies_includes_cad_usd_cop()
    {
        $response = $this->get(route('preferences.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('available_currencies', ['CAD', 'USD', 'COP'])
        );
    }

    public function test_new_user_defaults_to_en_locale()
    {
        $user = User::factory()->create();

        $this->assertSame('en', $user->fresh()->locale);
    }

    public function test_spanish_locale_user_gets_spanish_validation_messages()
    {
        $this->user->update(['locale' => 'es']);

        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'locale' => 'fr',
        ]);

        $response->assertSessionHasErrors('locale');
        $errors = session('errors')->get('locale');
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('válido', $errors[0]);
    }

    public function test_guest_validation_messages_remain_english()
    {
        auth()->logout();

        $response = $this->post(route('login.store'), [
            'email' => 'not-an-email',
            'password' => '',
        ]);

        $response->assertSessionHasErrors();
        $message = collect(session('errors')->all())->flatten()->first();
        $this->assertIsString($message);
        $this->assertDoesNotMatchRegularExpression('/[áéíóúñ]/u', $message);
    }
}
