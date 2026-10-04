import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('Browser test for delete rejection with transactions', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('complete delete rejection workflow - 7 steps', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Step 1: Setup test with category and transaction
        await loginAsBrowserTestUser(page, request);

        // Create a category
        const createResponse = await request.post('/api/categories', {
            data: {
                name: 'Delete Test Category',
                is_debt_category: false,
                is_income_category: false,
            },
        });
        expect(createResponse.status()).toBe(201);
        const created = (await createResponse.json()) as {
            data: { id: number; code: string };
        };
        const categoryId = created.data.id;
        const categoryCode = created.data.code;

        // Create a transaction with this category
        const txnResponse = await request.post('/api/transactions', {
            data: {
                date: '2026-01-15',
                period: '202601',
                category_id: categoryId,
                amount_cad: 100.0,
                comments: 'Test for delete rejection',
            },
        });
        expect(txnResponse.status()).toBe(201);

        // Step 2: Login and navigate to categories
        await page.goto('/categories');
        await expect(
            page.getByTestId(`category-card-${categoryCode}`),
        ).toBeVisible();

        await page.screenshot({
            path: 'verification/e2e-delete-rejection/01-category-with-transaction.png',
            fullPage: true,
        });

        // Step 3: Click delete on test category
        const categoryCard = page.getByTestId(`category-card-${categoryCode}`);
        const dialogMessages: string[] = [];

        page.on('dialog', async (dialog) => {
            dialogMessages.push(dialog.message());
            await dialog.accept();
        });

        // Step 4: Confirm deletion
        await categoryCard
            .getByRole('button', { name: new RegExp(`delete ${categoryCode}`, 'i') })
            .click();

        // Wait for both dialogs (confirmation + error)
        await expect
            .poll(() => dialogMessages.length, { timeout: 5000 })
            .toBeGreaterThanOrEqual(2);

        // Step 5: Verify error message appears with transaction text
        expect(dialogMessages[0]).toContain(categoryCode); // Confirmation dialog
        expect(dialogMessages[1].toLowerCase()).toMatch(
            /transaction|cannot be deleted/,
        ); // Error dialog

        await page.screenshot({
            path: 'verification/e2e-delete-rejection/02-after-delete-attempt.png',
            fullPage: true,
        });

        // Step 6: Verify category still present on page
        await expect(
            page.getByTestId(`category-card-${categoryCode}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`category-name-${categoryCode}`),
        ).toContainText('Delete Test Category');

        // Step 7: Verify test passes
        expect(consoleErrors).toEqual([]);
    });
});
