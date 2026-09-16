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
        $this->user = User::factory()->create(['default_currency' => 'CAD']);
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
            ->has('available_category_languages')
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

    public function test_user_can_update_default_currency_to_cad()
    {
        $this->user->update(['default_currency' => 'USD']);

        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'category_language' => 'en',
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
            'category_language' => 'en',
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
            'category_language' => 'en',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'default_currency' => 'COP',
        ]);
    }

    public function test_default_currency_is_required()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => '',
            'category_language' => 'en',
        ]);

        $response->assertSessionHasErrors('default_currency');
    }

    public function test_default_currency_must_be_valid()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'INVALID',
            'category_language' => 'en',
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

    public function test_preferences_page_shows_current_category_language()
    {
        $this->user->update(['category_language' => 'es']);

        $response = $this->get(route('preferences.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('user.category_language', 'es')
            ->where('available_category_languages', ['es', 'en'])
        );
    }

    public function test_user_can_update_category_language_to_spanish()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'category_language' => 'es',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'category_language' => 'es',
        ]);
    }

    public function test_user_can_update_category_language_to_english()
    {
        $this->user->update(['category_language' => 'es']);

        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'category_language' => 'en',
        ]);

        $response->assertRedirect(route('preferences.index'));
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'category_language' => 'en',
        ]);
    }

    public function test_category_language_is_required()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'category_language' => '',
        ]);

        $response->assertSessionHasErrors('category_language');
    }

    public function test_category_language_must_be_valid()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'CAD',
            'category_language' => 'fr',
        ]);

        $response->assertSessionHasErrors('category_language');
    }
}
