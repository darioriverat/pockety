<?php

namespace Tests\Feature;

use App\Domain\Services\Contracts\AvailablePeriodServiceInterface;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailablePeriodTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    protected function tearDown(): void
    {
        $this->travelBack();

        parent::tearDown();
    }

    public function test_selectable_periods_run_from_the_earliest_transaction_through_the_current_month(): void
    {
        $this->travelTo('2026-10-03 12:00:00');
        $category = Category::factory()->create();

        $this->createTransaction($category, '2026-11-02', '202611');
        $this->createTransaction($category, '2026-03-15', '202603');
        $this->createTransaction($category, '2025-08-01', '202508');

        $periods = app(AvailablePeriodServiceInterface::class)->selectable();

        $this->assertSame('202508', $periods[0]);
        $this->assertSame('202610', $periods[array_key_last($periods)]);
        $this->assertContains('202509', $periods);
        $this->assertNotContains('202507', $periods);
        $this->assertNotContains('202611', $periods);
        $this->assertCount(15, $periods);
    }

    public function test_selectable_periods_are_the_current_month_when_there_are_no_transactions(): void
    {
        $this->travelTo('2026-10-03 12:00:00');

        $this->assertSame(
            ['202610'],
            app(AvailablePeriodServiceInterface::class)->selectable(),
        );
    }

    public function test_selectable_periods_stay_on_the_current_month_when_transactions_are_only_in_the_future(): void
    {
        $this->travelTo('2026-10-03 12:00:00');
        $category = Category::factory()->create();
        $this->createTransaction($category, '2026-11-02', '202611');

        $this->assertSame(
            ['202610'],
            app(AvailablePeriodServiceInterface::class)->selectable(),
        );
    }

    public function test_inertia_pages_share_selectable_periods(): void
    {
        $this->travelTo('2026-10-03 12:00:00');
        $category = Category::factory()->create();
        $this->createTransaction($category, '2025-09-04', '202509');

        $response = $this->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('availablePeriods.0', '202509')
            ->where('availablePeriods.13', '202610')
            ->has('availablePeriods', 14)
        );
    }

    private function createTransaction(Category $category, string $date, string $period): void
    {
        Transaction::query()->create([
            'user_id' => $this->user->id,
            'date' => $date,
            'period' => $period,
            'category_id' => $category->id,
            'amount_cad' => 10,
        ]);
    }
}
