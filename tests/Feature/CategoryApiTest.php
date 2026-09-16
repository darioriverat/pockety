<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->seed(CategorySeeder::class);
    }

    public function test_get_categories_returns_45_active_with_expected_fields(): void
    {
        $response = $this->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonPath('meta.total', 45);

        $data = $response->json('data');
        $this->assertCount(45, $data);

        $sample = $data[0];
        $this->assertArrayHasKey('code', $sample);
        $this->assertArrayHasKey('name_es', $sample);
        $this->assertArrayHasKey('name_en', $sample);
        $this->assertArrayHasKey('is_debt_category', $sample);

        $codes = array_column($data, 'code');
        $this->assertNotContains('C040', $codes);
    }
}
