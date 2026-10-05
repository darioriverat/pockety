import { test, expect } from '@playwright/test';
import { loginAsBrowserTestUser as login, resetBrowserState } from './helpers';

test.describe('Category Inactivate and Reactivate', () => {
    test.beforeEach(() => {
        resetBrowserState();
    });

    test('inactivate category via update endpoint (Feature #11)', async ({ page }) => {
        await login(page);
        await page.goto('/categories');

        // Step 1: Create active category
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Category to Inactivate');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();

        // Wait for dialog to close and category to appear
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        // Find the new category card (will be C047 as first custom category)
        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();

        // Step 2: Verify is_active is true (no Retired badge initially)
        const retiredBadge = categoryCard.getByText('Retired');
        await expect(retiredBadge).not.toBeVisible();

        // Verify the card is not semi-transparent (active categories have full opacity)
        await expect(categoryCard).not.toHaveClass(/opacity-50/);

        // Step 3: PUT /api/categories/{code} with is_active false
        // Open edit dialog and uncheck Active
        await page.getByTestId('edit-category-C047').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        // Verify Active checkbox is checked
        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).toBeChecked();

        // Uncheck the Active checkbox
        await activeCheckbox.click();
        await expect(activeCheckbox).not.toBeChecked();

        // Submit the form
        await page.getByTestId('edit-category-submit').click();

        // Step 4: Verify response 200 (dialog closes without error)
        await expect(page.getByTestId('edit-category-dialog')).toBeHidden();
        
        // Step 5: Verify data.is_active is false (Retired badge appears)
        await expect(categoryCard.getByText('Retired')).toBeVisible();

        // Step 6: Verify category still exists in database (visible on page with reduced opacity)
        await expect(categoryCard).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);

        // Verify name is still visible
        await expect(page.getByTestId('category-name-C047')).toContainText('Category to Inactivate');
    });

    test('reactivate category via update endpoint (Feature #12)', async ({ page }) => {
        await login(page);
        await page.goto('/categories');

        // Step 1: Create category and inactivate it
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Category to Reactivate');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        const categoryCard = page.getByTestId('category-card-C047');
        
        // Inactivate it first
        await page.getByTestId('edit-category-C047').click();
        await page.getByTestId('edit-category-active').click();
        await page.getByTestId('edit-category-submit').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeHidden();

        // Step 2: Verify is_active is false
        await expect(categoryCard.getByText('Retired')).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);

        // Step 3: PUT /api/categories/{code} with is_active true
        await page.getByTestId('edit-category-C047').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).not.toBeChecked();

        // Check the Active checkbox
        await activeCheckbox.click();
        await expect(activeCheckbox).toBeChecked();

        // Submit
        await page.getByTestId('edit-category-submit').click();

        // Step 4: Verify response 200 (dialog closes without error)
        await expect(page.getByTestId('edit-category-dialog')).toBeHidden();

        // Step 5: Verify data.is_active is true (no Retired badge, full opacity restored)
        await expect(categoryCard.getByText('Retired')).not.toBeVisible();
        await expect(categoryCard).not.toHaveClass(/opacity-50/);
    });

    test('inactivate category even when transactions exist (Feature #13)', async ({ page, request }) => {
        await login(page, request);

        // Step 1: Create category
        await page.goto('/categories');
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Category with Transactions');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();

        // Get the category ID from the API to create a transaction
        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesBody = await categoriesResponse.json();
        const category = categoriesBody.data.find((c: any) => c.code === 'C047');
        expect(category).toBeTruthy();

        const accountResponse = await request.post('/api/accounts', {
            data: {
                name: 'Inactivate Checking',
                type: 'bank',
                primary_currency: 'CAD',
            },
        });
        expect(accountResponse.ok()).toBeTruthy();
        const account = (await accountResponse.json()).data as { id: number };
        expect(account).toBeTruthy();

        // Step 2: Create transaction using this category
        const transactionResponse = await request.post('/api/transactions', {
            data: {
                date: '2026-10-01',
                period: '202610',
                category_id: category.id,
                account_id: account.id,
                amount_cad: 100.00,
                comments: 'Test transaction for category inactivation',
            },
        });
        expect(transactionResponse.ok()).toBeTruthy();

        // Refresh to ensure UI state is consistent
        await page.reload();
        await expect(categoryCard).toBeVisible();

        // Step 3: PUT /api/categories/{code} with is_active false
        await page.getByTestId('edit-category-C047').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).toBeChecked();

        // Uncheck Active
        await activeCheckbox.click();
        await expect(activeCheckbox).not.toBeChecked();

        // Submit
        await page.getByTestId('edit-category-submit').click();

        // Step 4: Verify response 200 (dialog closes without error)
        await expect(page.getByTestId('edit-category-dialog')).toBeHidden();

        // Step 5: Verify is_active updated successfully despite transaction
        await expect(categoryCard.getByText('Retired')).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);

        // Step 6: Verify existing transaction still valid
        // Navigate to transactions page and verify the transaction exists
        await page.goto('/transactions');
        await expect(page.getByText('Test transaction for category inactivation')).toBeVisible();
    });
});
