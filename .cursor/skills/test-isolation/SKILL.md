---
name: test-isolation
description: Keep backend, frontend, and Playwright tests independent by avoiding shared mutable state. Use when adding seeders, factories, browser tests, or any test that creates, updates, or deletes application data.
---

# Test Isolation

Tests must run in any order and still pass. Do **not** let one test prepare data for another.

## Core rule

Every test suite should start from a known database state and create its own scenario data.

- **Shared baseline data**: stable lookup/reference data only
- **Scenario data**: users, transactions, balances, and records specific to the test
- **No cross-test coupling**: one test must not rely on data created or modified by a previous test

## Recommended split

### Reference seeders

Use seeders for read-only catalog data shared across many tests.

Examples in this project:

- `CategorySeeder`
- future exchange-rate or account-catalog seeders

Reference seeders should be safe to run repeatedly.

### Scenario seeders

Use dedicated seeders for browser or feature-specific flows.

Examples:

- `BrowserTestSeeder`
- `BrowserFeature01Seeder`
- `BrowserFeature02Seeder`

Scenario seeders should create only the minimum data needed for the feature under test.

## Browser tests

For Playwright tests in this repo:

1. Seed baseline data before the suite or spec.
2. Seed a known test user for authentication.
3. If a spec mutates business data, reseed or reset before the next spec.
4. Prefer one feature per spec file with explicit setup.

Do **not** assume a previous browser test already created:

- a transaction
- an account
- a balance
- a specific user state

## Reset strategy

Prefer resetting state before a suite or spec instead of cleaning up manually in the test body.

Good options:

```bash
php artisan migrate:fresh --seed --seeder=BrowserTestSeeder
```

Or:

```bash
php artisan db:seed --class=BrowserFeature01Seeder
```

Use `migrate:fresh` when tests may have changed persisted data in ways that can affect later tests.

Use a targeted seeder when the database is already in a controlled state and you only need deterministic scenario setup.

## Laravel backend tests

Prefer factories and `RefreshDatabase` for PHP tests:

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
    }
}
```

Use factories for mutable scenario data instead of relying on seeders with broad data sets.

## Frontend unit/component tests

Frontend tests should not depend on prior browser runs or real database state.

- mock page props explicitly
- pass only the data the component needs
- avoid hidden dependency on server state

If a component needs a user, categories, or route props, provide them directly in the test setup.

## Parallel safety

If browser tests will run in parallel, shared mutable database state becomes risky.

Prefer one of these approaches:

1. one isolated test database per worker
2. serial browser execution until worker isolation exists
3. idempotent reseeding before each spec

Do **not** enable parallel execution for mutation-heavy browser tests unless the database isolation strategy is explicit.

## Naming

Use names that make the scope obvious:

- `BrowserTestSeeder` for shared browser baseline
- `BrowserFeature01Seeder` for feature-specific setup
- `TransactionFactory` states for transaction scenarios

Avoid vague names like:

- `TestSeeder`
- `DemoSeeder`
- `TempSeeder`

## Preferred workflow

When adding a new test that touches data:

1. identify immutable reference data
2. create the smallest scenario data set for that test
3. reset or reseed before execution
4. assert only the behavior owned by that test

## Anti-patterns

Do **not**:

- create data in feature 1 and reuse it in feature 2
- depend on auto-incremented IDs from previous tests
- share one mutable “global test user” across unrelated mutation-heavy scenarios
- make UI tests clean up data only at the end and assume they completed successfully
- store hidden assumptions about execution order

## Project guidance

For this repo, prefer:

- lookup data via `CategorySeeder`
- authentication via a dedicated browser test user
- feature-specific scenario seeders as Playwright coverage grows
- Docker-backed test commands that seed explicitly before running
