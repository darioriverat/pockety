# E2E Browser Tests Verification Guide

## Overview

This guide documents the 6 comprehensive end-to-end browser tests that have been created to verify the remaining features in `feature_list.json`.

## Test Files Created

All test files are located in `tests/browser/` and follow Playwright testing patterns:

1. **e2e-category-workflow.spec.ts** - Complete 23-step category workflow
2. **e2e-two-user-isolation.spec.ts** - Complete 25-step two-user isolation workflow
3. **e2e-category-create-workflow.spec.ts** - 10-step category create workflow
4. **e2e-category-edit-workflow.spec.ts** - 7-step category edit workflow
5. **e2e-category-inactivate-picker.spec.ts** - 8-step inactivate and picker exclusion workflow
6. **e2e-delete-rejection.spec.ts** - 7-step delete rejection workflow

## Running the Tests

### Prerequisites

1. Application server must be running at `http://dev.pockety.com:8080`
2. Playwright browser binaries must be installed: `npx playwright install chromium`
3. Database must be seeded with BrowserTestSeeder

### Running All E2E Tests

From inside the Docker container:
```bash
task browser-tests
```

Or manually:
```bash
# Seed the browser test data
php artisan db:seed --class=BrowserTestSeeder

# Run the E2E tests
PLAYWRIGHT_BASE_URL=http://dev.pockety.com:8080 npm run test:browser -- tests/browser/e2e-*.spec.ts
```

### Running Individual Tests

To run a specific E2E test:
```bash
npx playwright test tests/browser/e2e-category-workflow.spec.ts --reporter=list
```

## Feature Mapping

| Feature # | Feature Description | Test File | Steps |
|-----------|---------------------|-----------|-------|
| ~101 | End-to-end category workflow | e2e-category-workflow.spec.ts | 23 |
| ~102 | End-to-end two-user isolation | e2e-two-user-isolation.spec.ts | 25 |
| ~103 | Browser test: category create | e2e-category-create-workflow.spec.ts | 10 |
| ~104 | Browser test: category edit | e2e-category-edit-workflow.spec.ts | 7 |
| ~105 | Browser test: inactivate + picker | e2e-category-inactivate-picker.spec.ts | 8 |
| ~106 | Browser test: delete rejection | e2e-delete-rejection.spec.ts | 7 |

## Test Coverage

Each E2E test covers:

### 1. Category Workflow (e2e-category-workflow.spec.ts)
- Create expense category (validates code C047 assignment)
- Create transaction using the category
- Edit category name
- Verify kind fields locked when transactions exist
- Inactivate category
- Verify retired badge and opacity
- Verify inactive category excluded from picker
- Verify existing transaction still displays correctly
- Verify category appears in financial reports
- Attempt deletion and verify rejection with error message

### 2. Two-User Isolation (e2e-two-user-isolation.spec.ts)
- User A (Alice) logs in and creates custom category
- Alice creates transaction and budget
- User B (Bob) logs in independently
- Verify Bob has template categories but NOT Alice's custom category
- Bob creates category with same code (C047) - isolated per user
- Bob creates transaction
- Verify complete data isolation via API
- Verify Alice's data intact after Bob's session
- Verify cross-user access returns 404 or own data

### 3. Category Create Workflow (e2e-category-create-workflow.spec.ts)
- Navigate to categories page
- Open create dialog
- Fill form with test data
- Submit and verify 201 response
- Verify category appears without page reload
- Verify no console errors

### 4. Category Edit Workflow (e2e-category-edit-workflow.spec.ts)
- Setup test category via API
- Navigate to categories page
- Open edit dialog
- Modify name
- Submit and verify 200 response
- Verify name updated reactively

### 5. Inactivate + Picker Exclusion (e2e-category-inactivate-picker.spec.ts)
- Create test category
- Inactivate via edit dialog
- Verify retired badge appears
- Navigate to transactions page
- Open category picker
- Verify inactivated category NOT in picker options

### 6. Delete Rejection (e2e-delete-rejection.spec.ts)
- Create category with transaction
- Attempt to delete category
- Verify confirmation dialog appears
- Confirm deletion
- Verify error alert with "transaction" or "cannot be deleted" message
- Verify category still present on page

## Expected Results

All 6 tests should pass with:
- ✅ No console errors
- ✅ Correct HTTP response codes (201 for create, 200 for update, 422 for rejected delete)
- ✅ Proper UI updates without page reload
- ✅ Screenshots saved to `verification/` directory
- ✅ Complete data isolation between users
- ✅ Proper category code assignment (C047 for first custom category)

## Verification Checklist

After running tests, verify:

- [ ] All 6 E2E tests pass
- [ ] No console errors in browser
- [ ] Screenshots generated in verification/ directories
- [ ] Backend tests still passing (374 tests)
- [ ] Frontend tests still passing (237 tests)
- [ ] Application remains in working state

## Updating feature_list.json

Once all tests pass, update the corresponding features:

```bash
# Manually edit feature_list.json
# Change "passes": false to "passes": true for features 101-106
```

## Troubleshooting

### Test Fails with "Cannot find category"
- Ensure BrowserTestSeeder has run
- Check that user is logged in correctly
- Verify application is accessible at base URL

### Test Fails with Network Errors
- Check that `dev.pockety.com` resolves correctly
- If running from Docker, use `http://host.docker.internal:8080`
- Verify application server is running

### Test Fails with Timeout
- Increase timeout in playwright.config.ts if needed
- Check for slow database queries
- Verify no blocking network calls

## Notes

- Tests use `resetBrowserState()` which migrates and seeds fresh data
- Each test is designed to be independent
- Tests create their own test data (categories, transactions)
- Screenshots are saved for manual verification
- All tests track console errors and fail if any occur
