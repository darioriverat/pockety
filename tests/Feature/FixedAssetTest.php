<?php

namespace Tests\Feature;

use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FixedAssetTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_fixed_assets_page(): void
    {
        $response = $this->get('/fixed-assets');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_fixed_assets_page(): void
    {
        $response = $this->actingAs($this->user)->get('/fixed-assets');
        $response->assertOk();
    }

    public function test_user_can_create_fixed_asset(): void
    {
        $data = [
            'name' => 'Ford Escape',
            'description' => 'Family vehicle',
            'acquisition_date' => '2020-05-15',
            'initial_value_cad' => 25000.00,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/fixed-assets', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'acquisition_date',
                    'initial_value_cad',
                    'is_active',
                ],
            ]);

        $this->assertDatabaseHas('fixed_assets', [
            'name' => 'Ford Escape',
            'description' => 'Family vehicle',
            'initial_value_cad' => 25000.00,
            'is_active' => true,
        ]);
    }

    public function test_fixed_asset_name_is_required(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/fixed-assets', [
                'description' => 'Vehicle',
                'initial_value_cad' => 25000.00,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_user_can_list_fixed_assets(): void
    {
        FixedAsset::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->getJson('/api/fixed-assets');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'description', 'initial_value_cad'],
                ],
                'meta' => ['total'],
            ])
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_get_single_fixed_asset(): void
    {
        $asset = FixedAsset::factory()->create([
            'name' => 'Honda Civic',
            'initial_value_cad' => 20000.00,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/fixed-assets/{$asset->id}");

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'id' => $asset->id,
                    'name' => 'Honda Civic',
                    'initial_value_cad' => 20000.00,
                ],
            ]);
    }

    public function test_returns_404_for_nonexistent_fixed_asset(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/fixed-assets/999');

        $response->assertStatus(404);
    }

    public function test_user_can_update_fixed_asset(): void
    {
        $asset = FixedAsset::factory()->create([
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/fixed-assets/{$asset->id}", [
                'name' => 'Updated Name',
                'description' => 'Updated description',
            ]);

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'name' => 'Updated Name',
                    'description' => 'Updated description',
                ],
            ]);

        $this->assertDatabaseHas('fixed_assets', [
            'id' => $asset->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_user_can_deactivate_fixed_asset(): void
    {
        $asset = FixedAsset::factory()->create([
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/fixed-assets/{$asset->id}");

        $response->assertOk();

        $this->assertDatabaseHas('fixed_assets', [
            'id' => $asset->id,
            'is_active' => false,
        ]);
    }

    public function test_user_can_set_book_value_for_period(): void
    {
        $asset = FixedAsset::factory()->create([
            'name' => 'Ford Escape',
        ]);

        $data = [
            'period' => '202501',
            'book_value_cad' => 25000.00,
            'depreciation_cad' => 500.00,
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", $data);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'fixed_asset_id' => $asset->id,
                    'period' => '202501',
                    'book_value_cad' => 25000.00,
                    'depreciation_cad' => 500.00,
                ],
            ]);

        $this->assertDatabaseHas('fixed_asset_valuations', [
            'fixed_asset_id' => $asset->id,
            'period' => '202501',
            'book_value_cad' => 25000.00,
        ]);
    }

    public function test_book_value_can_vary_per_period(): void
    {
        $asset = FixedAsset::factory()->create();

        // Set book value for January 2025
        $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", [
                'period' => '202501',
                'book_value_cad' => 25000.00,
            ]);

        // Set different book value for February 2025
        $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", [
                'period' => '202502',
                'book_value_cad' => 24500.00,
            ]);

        $this->assertDatabaseHas('fixed_asset_valuations', [
            'fixed_asset_id' => $asset->id,
            'period' => '202501',
            'book_value_cad' => 25000.00,
        ]);

        $this->assertDatabaseHas('fixed_asset_valuations', [
            'fixed_asset_id' => $asset->id,
            'period' => '202502',
            'book_value_cad' => 24500.00,
        ]);
    }

    public function test_updating_valuation_for_same_period_updates_existing(): void
    {
        $asset = FixedAsset::factory()->create();

        // Create initial valuation
        $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", [
                'period' => '202501',
                'book_value_cad' => 25000.00,
            ]);

        // Update the same period
        $response = $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", [
                'period' => '202501',
                'book_value_cad' => 24000.00,
                'depreciation_cad' => 1000.00,
            ]);

        $response->assertStatus(200); // 200 for update, not 201

        $this->assertDatabaseCount('fixed_asset_valuations', 1);
        $this->assertDatabaseHas('fixed_asset_valuations', [
            'fixed_asset_id' => $asset->id,
            'period' => '202501',
            'book_value_cad' => 24000.00,
            'depreciation_cad' => 1000.00,
        ]);
    }

    public function test_user_can_get_valuations_for_fixed_asset(): void
    {
        $asset = FixedAsset::factory()->create();

        FixedAssetValuation::factory()->create([
            'fixed_asset_id' => $asset->id,
            'period' => '202501',
            'book_value_cad' => 25000.00,
        ]);

        FixedAssetValuation::factory()->create([
            'fixed_asset_id' => $asset->id,
            'period' => '202502',
            'book_value_cad' => 24500.00,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/fixed-assets/{$asset->id}/valuations");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'period', 'book_value_cad', 'depreciation_cad'],
                ],
            ]);
    }

    public function test_valuations_can_be_filtered_by_period(): void
    {
        $asset = FixedAsset::factory()->create();

        FixedAssetValuation::factory()->create([
            'fixed_asset_id' => $asset->id,
            'period' => '202501',
            'book_value_cad' => 25000.00,
        ]);

        FixedAssetValuation::factory()->create([
            'fixed_asset_id' => $asset->id,
            'period' => '202502',
            'book_value_cad' => 24500.00,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/fixed-assets/{$asset->id}/valuations?period=202501");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJson([
                'data' => [
                    ['period' => '202501'],
                ],
            ]);
    }

    public function test_period_format_validation_requires_six_digits(): void
    {
        $asset = FixedAsset::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", [
                'period' => '2025-01', // Invalid format
                'book_value_cad' => 25000.00,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('period');
    }

    public function test_book_value_must_be_positive(): void
    {
        $asset = FixedAsset::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson("/api/fixed-assets/{$asset->id}/valuations", [
                'period' => '202501',
                'book_value_cad' => -1000.00,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('book_value_cad');
    }

    public function test_fixed_assets_are_included_in_balance_sheet(): void
    {
        $asset = FixedAsset::factory()->create([
            'name' => 'Ford Escape',
            'initial_value_cad' => 25000.00,
        ]);

        FixedAssetValuation::factory()->create([
            'fixed_asset_id' => $asset->id,
            'period' => '202501',
            'book_value_cad' => 25000.00,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/balance-sheet?period=202501');

        $response->assertOk()
            ->assertJsonPath('data.total_assets.fixed_assets_cad', 25000.00);

        // Verify it's in the breakdown
        $breakdown = $response->json('data.total_assets.breakdown');
        $fixedAsset = collect($breakdown)->firstWhere('type', 'fixed_asset');

        $this->assertNotNull($fixedAsset);
        $this->assertEquals($asset->id, $fixedAsset['id']);
        $this->assertEquals('Ford Escape', $fixedAsset['name']);
        $this->assertEquals(25000.00, $fixedAsset['cad']);
    }
}
