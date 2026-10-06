import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.describe('Browser test for delete rejection with transactions', () => {
    test('complete delete rejection workflow - 7 steps', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (error) => consoleErrors.push(error.message));
        page.on('console', (message) => {
            // Chromium logs the intentional delete rejection as a resource error.
            if (
                message.type() === 'error' &&
                !message.text().includes('status of 422') &&
                !message.text().includes('status of 4')
            ) {
                consoleErrors.push(message.text());
            }
        });

        // Step 1: Setup with isolated user, category, and transaction.
        // Avoid migrate:fresh / shared BrowserTestSeeder so the shared
        // development database is not wiped between sessions.
        await page.goto('/register');
        await page
            .getByLabel('Name', { exact: true })
            .fill('Category Delete Rejection');
        await page
            .getByLabel('Email address')
            .fill(`delete-rejection-${randomUUID()}@example.com`);
        await page
            .getByLabel('Password', { exact: true })
            .fill('Delete-rejection-105!');
        await page.getByLabel('Confirm password').fill('Delete-rejection-105!');
        await page
            .getByRole('button', { name: 'Create account', exact: true })
            .click();
        await expect(page).toHaveURL(/\/dashboard$/);

        await page.goto('/categories');
        await expect(page).toHaveURL(/\/categories$/);
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();
        await page
            .getByTestId('category-name-input')
            .fill('Delete Test Category');
        await page.getByTestId('kind-expense').check();
        const createResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/categories'),
        );
        await page.getByTestId('create-category-submit').click();
        const createResponse = await createResponsePromise;
        expect(createResponse.status()).toBe(201);
        const { data: created } = (await createResponse.json()) as {
            data: { id: number; code: string; name: string };
        };
        expect(created.code).toMatch(/^C\d{3,}$/);
        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);

        // Create a transaction on this category through the real UI.
        await page.goto('/transactions');
        await page
            .getByRole('button', { name: 'Add Transaction', exact: true })
            .click();
        await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();
        await page.getByTestId('transaction-date-input').fill('2026-01-15');
        await expect(page.getByTestId('transaction-period-input')).toHaveValue(
            '202601',
        );
        await page.getByTestId('transaction-category-field').click();
        await page
            .getByRole('option', {
                name: `${created.code} - Delete Test Category`,
                exact: true,
            })
            .click();
        await page.getByTestId('transaction-amount-input').fill('100.00');
        await page.getByLabel('Comments').fill('Test for delete rejection');
        const txnResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/transactions'),
        );
        await page.getByTestId('transaction-form-submit').click();
        const txnResponse = await txnResponsePromise;
        expect(txnResponse.status()).toBe(201);
        await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(
            0,
        );

        // Step 2: Navigate to categories and confirm the card is present.
        await page.goto('/categories');
        const categoryCard = page.getByTestId(`category-card-${created.code}`);
        await expect(categoryCard).toBeVisible();
        await expect(
            page.getByTestId(`category-name-${created.code}`),
        ).toContainText('Delete Test Category');
        await categoryCard.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: 'verification/e2e-delete-rejection/01-category-with-transaction.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Steps 3–4: Click delete and confirm.
        const dialogMessages: string[] = [];
        page.on('dialog', async (dialog) => {
            dialogMessages.push(dialog.message());
            await dialog.accept();
        });

        const deleteResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'DELETE' &&
                response.url().endsWith(`/api/categories/${created.code}`),
        );
        await categoryCard
            .getByRole('button', {
                name: new RegExp(`delete ${created.code}`, 'i'),
            })
            .click();
        const deleteResponse = await deleteResponsePromise;
        expect(deleteResponse.status()).toBe(422);
        expect(await deleteResponse.json()).toMatchObject({
            has_transactions: true,
            message:
                'This category has associated transactions and cannot be deleted',
        });

        await expect
            .poll(() => dialogMessages.length, { timeout: 5000 })
            .toBeGreaterThanOrEqual(2);

        // Step 5: Verify error message appears with transaction text.
        expect(dialogMessages[0]).toContain(created.code);
        expect(dialogMessages[1]).toBe(
            'This category has associated transactions and cannot be deleted',
        );

        await categoryCard.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: 'verification/e2e-delete-rejection/02-after-delete-attempt.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Step 6: Verify category still present on page.
        await expect(categoryCard).toBeVisible();
        await expect(
            page.getByTestId(`category-name-${created.code}`),
        ).toContainText('Delete Test Category');

        // Step 7: Verify test passes.
        expect(consoleErrors).toEqual([]);
    });
});
