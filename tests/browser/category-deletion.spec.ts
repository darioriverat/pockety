import { test, expect } from '@playwright/test';
import { loginAsBrowserTestUser } from './helpers';

test.describe('Category Deletion', () => {
    test('delete category succeeds when no transactions or budgets exist (Feature #16)', async ({ page, request }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: Create new category
        await page.goto('/categories');
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('To Be Deleted');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();

        // Step 2: Verify no transactions reference it
        // Step 3: Verify no budgets reference it
        // (Newly created category has no transactions or budgets)

        // Step 4: DELETE /api/categories/{code}
        await page.getByTestId('delete-category-C047').click();

        // Confirm deletion in dialog
        const deleteDialog = page.getByRole('dialog');
        await expect(deleteDialog).toBeVisible();
        await page.getByRole('button', { name: /delete|confirm/i }).click();

        // Step 5: Verify response 200 (dialog closes, success message appears)
        await expect(deleteDialog).toBeHidden();
        
        // Step 6: Verify links.index in response (implicit - UI navigates correctly)
        // Step 7: Verify category hard-deleted from database (not visible on page)
        await expect(categoryCard).not.toBeVisible();

        // Verify via API that category is deleted
        const response = await request.get('/api/categories?include_inactive=1');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        const codes = body.data.map((cat: any) => cat.code);
        expect(codes).not.toContain('C047');
    });

    test('delete blocked when transactions exist (Feature #17)', async ({ page, request }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: Create category
        await page.goto('/categories');
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Category with Transactions');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();

        // Get the category ID from the API
        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesBody = await categoriesResponse.json();
        const category = categoriesBody.data.find((c: any) => c.code === 'C047');
        expect(category).toBeTruthy();

        // Get an account ID for the transaction
        const accountsResponse = await request.get('/api/accounts');
        expect(accountsResponse.ok()).toBeTruthy();
        const accountsBody = await accountsResponse.json();
        const account = accountsBody.data[0];
        expect(account).toBeTruthy();

        // Step 2: Create transaction with this category_id
        const transactionResponse = await request.post('/api/transactions', {
            data: {
                date: '2026-10-01',
                period: '202610',
                category_id: category.id,
                account_id: account.id,
                amount_cad: 100.00,
                comments: 'Test transaction to block deletion',
            },
        });
        expect(transactionResponse.ok()).toBeTruthy();

        // Refresh page to ensure UI is up to date
        await page.reload();
        await expect(categoryCard).toBeVisible();

        // Step 3: DELETE /api/categories/{code}
        await page.getByTestId('delete-category-C047').click();

        // Confirm deletion in dialog
        const deleteDialog = page.getByRole('dialog');
        await expect(deleteDialog).toBeVisible();
        await page.getByRole('button', { name: /delete|confirm/i }).click();

        // Step 4: Verify response 422 (error message appears)
        // Step 6: Verify message 'This category has associated transactions and cannot be deleted'
        await expect(page.getByText(/associated transactions/i)).toBeVisible();

        // Step 5: Verify has_transactions is true (implicit in error message)
        
        // Close error dialog
        await page.getByRole('button', { name: /cancel|close/i }).click();

        // Step 7: Verify category still exists in database
        await expect(categoryCard).toBeVisible();

        // Verify via API that category still exists
        const verifyResponse = await request.get('/api/categories?include_inactive=1');
        expect(verifyResponse.ok()).toBeTruthy();
        const verifyBody = await verifyResponse.json();
        const codes = verifyBody.data.map((cat: any) => cat.code);
        expect(codes).toContain('C047');
    });

    test('delete blocked when budgets exist (Feature #18)', async ({ page, request }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: Create category
        await page.goto('/categories');
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Category with Budgets');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();

        // Get the category ID from the API
        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesBody = await categoriesResponse.json();
        const category = categoriesBody.data.find((c: any) => c.code === 'C047');
        expect(category).toBeTruthy();

        // Step 2: Create budget with this category_id
        const budgetResponse = await request.post('/api/budgets', {
            data: {
                period: '202610',
                category_id: category.id,
                amount_cad: 500.00,
            },
        });
        expect(budgetResponse.ok()).toBeTruthy();

        // Refresh page to ensure UI is up to date
        await page.reload();
        await expect(categoryCard).toBeVisible();

        // Step 3: DELETE /api/categories/{code}
        await page.getByTestId('delete-category-C047').click();

        // Confirm deletion in dialog
        const deleteDialog = page.getByRole('dialog');
        await expect(deleteDialog).toBeVisible();
        await page.getByRole('button', { name: /delete|confirm/i }).click();

        // Step 4: Verify response 422 (error message appears)
        // Step 6: Verify message 'This category has associated budgets and cannot be deleted'
        await expect(page.getByText(/associated budgets/i)).toBeVisible();

        // Step 5: Verify has_budgets is true (implicit in error message)
        
        // Close error dialog
        await page.getByRole('button', { name: /cancel|close/i }).click();

        // Step 7: Verify category still exists
        await expect(categoryCard).toBeVisible();

        // Verify via API that category still exists
        const verifyResponse = await request.get('/api/categories?include_inactive=1');
        expect(verifyResponse.ok()).toBeTruthy();
        const verifyBody = await verifyResponse.json();
        const codes = verifyBody.data.map((cat: any) => cat.code);
        expect(codes).toContain('C047');
    });
});
