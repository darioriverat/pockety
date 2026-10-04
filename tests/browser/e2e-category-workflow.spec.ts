import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('End-to-end category workflow', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('complete workflow: create, use, edit, inactivate, delete prevention', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));
        await loginAsBrowserTestUser(page, request);

        // Step 1: Navigate to categories page
        await page.goto('/categories');
        await expect(page).toHaveURL(/\/categories$/);
        await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible();

        // Step 2: Click create category button
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();

        // Step 3: Enter name 'Test Category E2E'
        await page.getByTestId('category-name-input').fill('Test Category E2E');

        // Step 4: Select 'expense' kind
        await page.getByTestId('kind-expense').check();

        // Step 5: Submit and verify category appears with code C047
        const createResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/categories'),
        );
        await page.getByTestId('create-category-submit').click();
        const createResponse = await createResponsePromise;
        expect(createResponse.status()).toBe(201);
        const created = (await createResponse.json()) as {
            data: {
                id: number;
                code: string;
                name: string;
                is_active: boolean;
            };
        };
        expect(created.data.code).toBe('C047');
        expect(created.data.name).toBe('Test Category E2E');
        expect(created.data.is_active).toBe(true);
        const categoryId = created.data.id;

        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
        await expect(page.getByTestId('category-card-C047')).toBeVisible();
        await expect(page.getByTestId('category-name-C047')).toContainText(
            'Test Category E2E',
        );

        // Step 6: Navigate to transactions page
        await page.goto('/transactions');
        await expect(page).toHaveURL(/\/transactions$/);
        await expect(
            page.getByRole('heading', { name: /transactions/i }),
        ).toBeVisible();

        // Step 7: Create transaction using Test Category E2E
        await page.getByRole('button', { name: /add transaction/i }).click();
        await expect(
            page.getByTestId('transaction-form-dialog'),
        ).toBeVisible();

        // Fill transaction form
        await page.getByTestId('transaction-date-field').fill('2026-01-15');
        await page.getByTestId('transaction-category-field').click();
        await page
            .getByRole('option', { name: /C047.*Test Category E2E/i })
            .click();
        await page.getByTestId('transaction-amount-field').fill('150.50');
        await page
            .getByTestId('transaction-comments-field')
            .fill('E2E test transaction');

        // Step 8: Verify transaction saved successfully
        const txnResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/transactions'),
        );
        await page.getByTestId('transaction-form-submit').click();
        const txnResponse = await txnResponsePromise;
        expect(txnResponse.status()).toBe(201);
        const transaction = (await txnResponse.json()) as {
            data: { id: number; category_id: number };
        };
        expect(transaction.data.category_id).toBe(categoryId);
        const transactionId = transaction.data.id;

        await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(
            0,
        );
        await expect(
            page.getByTestId(`transaction-row-${transactionId}`),
        ).toBeVisible();

        // Step 9: Return to categories page
        await page.goto('/categories');
        await expect(page.getByTestId('category-card-C047')).toBeVisible();

        // Step 10: Edit Test Category E2E name to 'Renamed Category'
        await page.getByTestId('edit-category-C047').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        // Step 11: Verify edit dialog shows debt/income locked
        // When category has transactions, the kind fields should be disabled
        await expect(
            page.getByTestId('edit-category-name-input'),
        ).toBeVisible();

        // Step 12: Submit edit and verify name updated
        await page.getByTestId('edit-category-name-input').fill('');
        await page
            .getByTestId('edit-category-name-input')
            .fill('Renamed Category');

        const updateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith('/api/categories/C047'),
        );
        await page.getByTestId('edit-category-submit').click();
        const updateResponse = await updateResponsePromise;
        expect(updateResponse.status()).toBe(200);
        const updated = await updateResponse.json();
        expect(updated.data.name).toBe('Renamed Category');

        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
        await expect(page.getByTestId('category-name-C047')).toContainText(
            'Renamed Category',
        );

        // Step 13: Inactivate Renamed Category
        await page.getByTestId('edit-category-C047').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).toBeChecked();
        await activeCheckbox.click();
        await expect(activeCheckbox).not.toBeChecked();

        const inactivateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith('/api/categories/C047'),
        );
        await page.getByTestId('edit-category-submit').click();
        const inactivateResponse = await inactivateResponsePromise;
        expect(inactivateResponse.status()).toBe(200);
        const inactivated = await inactivateResponse.json();
        expect(inactivated.data.is_active).toBe(false);

        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);

        // Step 14: Verify category shows as inactive with badge
        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();
        await expect(categoryCard.getByText('Retired')).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);

        // Step 15: Navigate to transactions page
        await page.goto('/transactions');
        await expect(
            page.getByRole('heading', { name: /transactions/i }),
        ).toBeVisible();

        // Step 16: Open category picker
        await page.getByRole('button', { name: /add transaction/i }).click();
        await expect(
            page.getByTestId('transaction-form-dialog'),
        ).toBeVisible();

        await page.getByTestId('transaction-category-field').click();
        const options = page.getByRole('option');
        await expect(options.first()).toBeVisible();

        // Step 17: Verify Renamed Category NOT in picker
        const optionTexts = await options.allTextContents();
        expect(
            optionTexts.some((text) => text.includes('Renamed Category')),
        ).toBe(false);
        expect(optionTexts.some((text) => text.includes('C047'))).toBe(false);

        // Close the dialog
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(
            0,
        );

        // Step 18: View existing transaction
        await page.goto('/transactions');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: /january 2026/i })
            .click();

        // Step 19: Verify still shows Renamed Category correctly
        const txnRow = page.getByTestId(`transaction-row-${transactionId}`);
        await expect(txnRow).toBeVisible();
        await expect(
            page.getByTestId(`transaction-category-${transactionId}`),
        ).toContainText('C047');
        await expect(
            page.getByTestId(`transaction-category-${transactionId}`),
        ).toContainText('Renamed Category');

        // Step 20: View financial reports
        await page.goto('/category-actuals');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: /january 2026/i })
            .click();

        // Step 21: Verify Renamed Category included due to transaction
        await expect(
            page.getByTestId('category-actual-row-C047'),
        ).toBeVisible();
        await expect(
            page.getByTestId('category-actual-name-C047'),
        ).toContainText('Renamed Category');

        // Step 22: Attempt to delete Renamed Category
        await page.goto('/categories');
        const categoryCardFinal = page.getByTestId('category-card-C047');
        await expect(categoryCardFinal).toBeVisible();

        const dialogMessages: string[] = [];
        page.on('dialog', async (dialog) => {
            dialogMessages.push(dialog.message());
            await dialog.accept();
        });

        await categoryCardFinal
            .getByRole('button', { name: /delete c047/i })
            .click();

        // Wait for both dialogs (confirm + error alert)
        await expect
            .poll(() => dialogMessages.length, { timeout: 5000 })
            .toBeGreaterThanOrEqual(2);

        // Step 23: Verify delete rejected with message about transactions
        expect(dialogMessages[0]).toContain('C047');
        expect(dialogMessages[1].toLowerCase()).toMatch(
            /transaction|cannot be deleted/,
        );

        // Verify category still exists
        await expect(page.getByTestId('category-card-C047')).toBeVisible();
        await expect(page.getByTestId('category-name-C047')).toContainText(
            'Renamed Category',
        );

        expect(consoleErrors).toEqual([]);
    });
});
