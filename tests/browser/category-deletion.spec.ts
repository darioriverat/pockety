import { test, expect, type Page } from '@playwright/test';
import { loginAsBrowserTestUser, resetBrowserState } from './helpers';

function acceptDialogs(page: Page): string[] {
    const messages: string[] = [];
    page.on('dialog', async (dialog) => {
        messages.push(dialog.message());
        await dialog.accept();
    });

    return messages;
}

test.describe('Category Deletion', () => {
    test.beforeEach(() => {
        resetBrowserState();
    });

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

        const dialogMessages = acceptDialogs(page);
        const deleteResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'DELETE' &&
                response.url().endsWith('/api/categories/C047'),
        );
        await categoryCard.getByRole('button', { name: /delete c047/i }).click();
        const deleteResponse = await deleteResponsePromise;
        expect(deleteResponse.status()).toBe(200);
        const deleteBody = await deleteResponse.json();
        expect(deleteBody.links.index).toContain('/api/categories');
        await expect.poll(() => dialogMessages.length).toBe(1);

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

        const accountResponse = await request.post('/api/accounts', {
            data: {
                name: 'Deletion Checking',
                type: 'bank',
                primary_currency: 'CAD',
            },
        });
        expect(accountResponse.ok()).toBeTruthy();
        const account = (await accountResponse.json()).data as { id: number };
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

        const dialogMessages = acceptDialogs(page);
        const deleteResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'DELETE' &&
                response.url().endsWith('/api/categories/C047'),
        );
        await categoryCard.getByRole('button', { name: /delete c047/i }).click();
        const deleteResponse = await deleteResponsePromise;
        expect(deleteResponse.status()).toBe(422);
        expect(await deleteResponse.json()).toMatchObject({
            has_transactions: true,
            message:
                'This category has associated transactions and cannot be deleted',
        });
        await expect.poll(() => dialogMessages.length).toBe(2);
        expect(dialogMessages[1]).toBe(
            'This category has associated transactions and cannot be deleted',
        );

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

        const dialogMessages = acceptDialogs(page);
        const deleteResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'DELETE' &&
                response.url().endsWith('/api/categories/C047'),
        );
        await categoryCard.getByRole('button', { name: /delete c047/i }).click();
        const deleteResponse = await deleteResponsePromise;
        expect(deleteResponse.status()).toBe(422);
        expect(await deleteResponse.json()).toMatchObject({
            has_budgets: true,
            message: 'This category has associated budgets and cannot be deleted',
        });
        await expect.poll(() => dialogMessages.length).toBe(2);
        expect(dialogMessages[1]).toBe(
            'This category has associated budgets and cannot be deleted',
        );

        await expect(categoryCard).toBeVisible();

        // Verify via API that category still exists
        const verifyResponse = await request.get('/api/categories?include_inactive=1');
        expect(verifyResponse.ok()).toBeTruthy();
        const verifyBody = await verifyResponse.json();
        const codes = verifyBody.data.map((cat: any) => cat.code);
        expect(codes).toContain('C047');
    });
});
