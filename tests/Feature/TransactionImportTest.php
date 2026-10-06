<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TransactionImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->seed(CategorySeeder::class);
    }

    public function test_json_upload_imports_rows_and_skips_incomplete_ones(): void
    {
        $response = $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('transactions_sample.json', 'application/json'),
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.imported', 2);
        $response->assertJsonPath('data.skipped', 2);
        $this->assertDatabaseCount('transactions', 2);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $this->user->id,
            'period' => '202501',
            'comments' => 'Synthetic groceries',
        ]);
        $this->assertSame([], Storage::disk('local')->allFiles('tmp/imports'));
    }

    public function test_csv_upload_maps_flat_columns_and_ignores_extra_columns(): void
    {
        $response = $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('transactions_sample.csv', 'text/csv'),
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.imported', 2);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $this->user->id,
            'period' => '202502',
            'comments' => 'CSV groceries',
            'amount_cad' => 15.25,
        ]);

        $extra = $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('transactions_extra_column.csv', 'text/csv'),
        ]);

        $extra->assertOk();
        $extra->assertJsonPath('data.imported', 1);
        $this->assertDatabaseHas('transactions', [
            'comments' => 'Has extra column',
            'amount_cad' => 9.99,
        ]);
    }

    public function test_csv_missing_required_header_returns_422(): void
    {
        $before = Transaction::query()->count();

        $response = $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('transactions_missing_header.csv', 'text/csv'),
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'CSV is missing required header: fecha']);
        $this->assertSame($before, Transaction::query()->count());
    }

    public function test_invalid_json_and_wrong_shape_return_422(): void
    {
        $broken = $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('invalid/broken.json', 'application/json'),
        ]);
        $broken->assertStatus(422);
        $this->assertStringContainsString('Invalid JSON', (string) $broken->json('message'));

        $shape = $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('invalid/not_an_array.json', 'application/json'),
        ]);
        $shape->assertStatus(422);
        $shape->assertJsonFragment([
            'message' => 'Transactions JSON must be an array of objects',
        ]);
    }

    public function test_disallowed_extension_returns_422(): void
    {
        $response = $this->post('/api/transactions/import', [
            'file' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ]);

        $response->assertStatus(422);
    }

    public function test_file_path_and_directory_are_rejected(): void
    {
        $pathResponse = $this->postJson('/api/transactions/import', [
            'file_path' => 'plan/extracted/gastos_ledger_2025_2026.json',
        ]);
        $pathResponse->assertStatus(422);

        $dirResponse = $this->postJson('/api/transactions/import', [
            'directory' => 'month_sheets',
        ]);
        $dirResponse->assertStatus(422);

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_import_is_owner_scoped(): void
    {
        $other = User::factory()->create();

        $this->post('/api/transactions/import', [
            'file' => $this->fixtureUpload('transactions_sample.json', 'application/json'),
        ])->assertOk();

        $this->assertSame(2, Transaction::query()->where('user_id', $this->user->id)->count());
        $this->assertSame(0, Transaction::query()->where('user_id', $other->id)->count());
    }

    public function test_missing_file_returns_422(): void
    {
        $response = $this->post('/api/transactions/import', []);

        $response->assertStatus(422);
    }

    private function fixtureUpload(string $relativePath, string $mime): UploadedFile
    {
        $absolute = base_path('tests/fixtures/'.$relativePath);

        return new UploadedFile(
            $absolute,
            basename($relativePath),
            $mime,
            null,
            true
        );
    }
}
