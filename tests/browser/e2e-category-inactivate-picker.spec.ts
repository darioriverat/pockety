import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { trackConsoleErrors } from './helpers';

test.describe('Browser test for category inactivate and picker exclusion', () => {
    test('complete inactivate and picker exclusion workflow - 8 steps', async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Step 1: Setup with an isolated user + seeded template catalog.
        // Avoid migrate:fresh / shared BrowserTestSeeder so the shared
        // development database is not wiped between sessions.
        await page.goto('/register');
        await page
            .getByLabel('Name', { exact: true })
            .fill('Category Inactivate Picker');
        await page
            .getByLabel('Email address')
            .fill(`inactivate-picker-${randomUUID()}@example.com`);
        await page
            .getByLabel('Password', { exact: true })
            .fill('Inactivate-picker-104!');
        await page
            .getByLabel('Confirm password')
            .fill('Inactivate-picker-104!');
        await page
            .getByRole('button', { name: 'Create account', exact: true })
            .click();
        await expect(page).toHaveURL(/\/dashboard$/);

        // Seed a category through the real create dialog.
        await page.goto('/categories');
        await expect(page).toHaveURL(/\/categories$/);
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();
        await page
            .getByTestId('category-name-input')
            .fill('Inactivate Picker Test');
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
            data: { code: string; name: string; is_active: boolean };
        };
        expect(created.code).toMatch(/^C\d{3,}$/);
        expect(created.is_active).toBe(true);
        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);

        // Step 2: Navigate to categories (already on page) and confirm card.
        const categoryCard = page.getByTestId(`category-card-${created.code}`);
        await expect(categoryCard).toBeVisible();
        await expect(
            page.getByTestId(`category-name-${created.code}`),
        ).toContainText('Inactivate Picker Test');
        await categoryCard.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/01-active-category.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Step 3: Inactivate test category via edit dialog.
        await page.getByTestId(`edit-category-${created.code}`).click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).toBeChecked();
        await activeCheckbox.uncheck();
        await expect(activeCheckbox).not.toBeChecked();

        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/02-edit-inactivate.png',
            animations: 'disabled',
        });

        const inactivateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith(`/api/categories/${created.code}`),
        );
        await page.getByTestId('edit-category-submit').click();
        const inactivateResponse = await inactivateResponsePromise;
        expect(inactivateResponse.status()).toBe(200);
        const { data: updated } = (await inactivateResponse.json()) as {
            data: { is_active: boolean };
        };
        expect(updated.is_active).toBe(false);
        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);

        // Step 4: Verify Retired badge appears and card is dimmed.
        await expect(categoryCard).toBeVisible();
        await expect(
            categoryCard.getByText('Retired', { exact: true }),
        ).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);
        await categoryCard.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/03-retired-category.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Step 5: Navigate to transactions page.
        await page.goto('/transactions');
        await expect(page).toHaveURL(/\/transactions$/);
        await expect(
            page.getByRole('heading', { name: /transactions/i }),
        ).toBeVisible();

        // Step 6: Open category picker in the add-transaction dialog.
        await page
            .getByRole('button', { name: 'Add Transaction', exact: true })
            .click();
        await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();

        await page.getByTestId('transaction-category-field').click();
        const options = page.getByRole('option');
        await expect(options.first()).toBeVisible();

        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/04-picker-open.png',
            animations: 'disabled',
        });

        // Step 7: Verify inactivated category is not in picker options.
        await expect(
            page.getByRole('option', {
                name: new RegExp(`${created.code}|Inactivate Picker Test`),
            }),
        ).toHaveCount(0);
        const optionTexts = await options.allTextContents();
        expect(
            optionTexts.some((text) => text.includes('Inactivate Picker Test')),
        ).toBe(false);
        expect(optionTexts.some((text) => text.includes(created.code))).toBe(
            false,
        );

        // Step 8: Verify test passes with no console errors.
        expect(consoleErrors).toEqual([]);
    });
});
