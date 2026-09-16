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
        ]);

        $response->assertSessionHasErrors('default_currency');
    }

    public function test_default_currency_must_be_valid()
    {
        $response = $this->post(route('preferences.update'), [
            'default_currency' => 'INVALID',
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
}
