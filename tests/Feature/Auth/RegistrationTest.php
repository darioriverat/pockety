<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_preserves_retired_template_category_in_owner_catalog(): void
    {
        $this->post(route('register.store'), [
            'name' => 'Template User',
            'email' => 'template@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('categories', [
            'user_id' => auth()->id(),
            'code' => 'C040',
            'is_active' => false,
            'status' => 'retired_merged_into_C031',
        ]);

        $this->getJson('/api/categories?include_inactive=1')
            ->assertOk()
            ->assertJsonCount(47, 'data')
            ->assertJsonFragment([
                'code' => 'C040',
                'is_active' => false,
                'status' => 'retired_merged_into_C031',
            ]);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonCount(46, 'data')
            ->assertJsonMissing(['code' => 'C040']);
    }
}
