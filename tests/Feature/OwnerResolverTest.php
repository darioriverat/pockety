<?php

namespace Tests\Feature;

use App\Actions\Fortify\CreateNewUser;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Category;
use App\Models\User;
use App\Support\CategoryTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_authenticated_user_id(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->assertSame((int) $user->id, app(OwnerResolverInterface::class)->id());
    }

    public function test_fails_when_unauthenticated(): void
    {
        $this->expectException(\RuntimeException::class);
        app(OwnerResolverInterface::class)->id();
    }

    public function test_api_categories_requires_authentication(): void
    {
        $this->getJson('/api/categories')->assertUnauthorized();
        $this->postJson('/api/categories', [
            'name' => 'X',
            'is_debt_category' => false,
            'is_income_category' => false,
        ])->assertUnauthorized();
    }

    public function test_api_categories_works_when_authenticated(): void
    {
        $user = User::factory()->create();
        CategoryTemplate::seedForUser((int) $user->id);
        $this->actingAs($user);

        $this->getJson('/api/categories')->assertOk();
    }

    public function test_create_new_user_copies_template(): void
    {
        $action = app(CreateNewUser::class);
        $user = $action->create([
            'name' => 'New Owner',
            'email' => 'owner-'.uniqid().'@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ]);

        $this->assertEquals(
            46,
            Category::query()->forUser((int) $user->id)->where('is_active', true)->count()
        );
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'code' => 'C040',
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'code' => 'I01',
        ]);
    }

    public function test_category_codes_isolated_per_user(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        CategoryTemplate::seedForUser((int) $userA->id);
        CategoryTemplate::seedForUser((int) $userB->id);

        $this->actingAs($userA);
        $codeA = app(CategoryServiceInterface::class)
            ->create('A Custom', false, false)
            ->code;

        $this->actingAs($userB);
        $codeB = app(CategoryServiceInterface::class)
            ->create('B Custom', false, false)
            ->code;

        $this->assertSame('C047', $codeA);
        $this->assertSame('C047', $codeB);
        $this->assertNotSame(
            Category::query()->forUser((int) $userA->id)->where('code', 'C047')->value('id'),
            Category::query()->forUser((int) $userB->id)->where('code', 'C047')->value('id'),
        );
    }

    public function test_other_users_custom_category_is_404(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        CategoryTemplate::seedForUser((int) $userA->id);
        CategoryTemplate::seedForUser((int) $userB->id);

        $this->actingAs($userA);
        app(CategoryServiceInterface::class)
            ->create('Only A', false, false);

        $this->actingAs($userB);
        $this->getJson('/api/categories/C047')->assertNotFound();
        $this->putJson('/api/categories/C047', ['name' => 'Stolen'])->assertNotFound();
        $this->deleteJson('/api/categories/C047')->assertNotFound();
    }
}
