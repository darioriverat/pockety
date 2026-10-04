import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('Browser test for category inactivate and picker exclusion', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('complete inactivate and picker exclusion workflow - 8 steps', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Step 1: Setup test with seeded category
        await loginAsBrowserTestUser(page, request);

        // Create a test category
        const createResponse = await request.post('/api/categories', {
            data: {
                name: 'Inactivate Picker Test',
                is_debt_category: false,
                is_income_category: false,
            },
        });
        expect(createResponse.status()).toBe(201);
        const created = (await createResponse.json()) as {
            data: { code: string };
        };
        const categoryCode = created.data.code;

        // Step 2: Login and navigate to categories
        await page.goto('/categories');
        await expect(
            page.getByTestId(`category-card-${categoryCode}`),
        ).toBeVisible();

        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/01-active-category.png',
            fullPage: true,
        });

        // Step 3: Inactivate test category
        await page.getByTestId(`edit-category-${categoryCode}`).click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).toBeChecked();
        await activeCheckbox.click();
        await expect(activeCheckbox).not.toBeChecked();

        const inactivateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith(`/api/categories/${categoryCode}`),
        );
        await page.getByTestId('edit-category-submit').click();
        const inactivateResponse = await inactivateResponsePromise;
        expect(inactivateResponse.status()).toBe(200);

        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);

        // Step 4: Verify Retired badge appears
        const categoryCard = page.getByTestId(`category-card-${categoryCode}`);
        await expect(categoryCard).toBeVisible();
        await expect(categoryCard.getByText('Retired')).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);

        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/02-retired-category.png',
            fullPage: true,
        });

        // Step 5: Navigate to transactions page
        await page.goto('/transactions');
        await expect(
            page.getByRole('heading', { name: /transactions/i }),
        ).toBeVisible();

        // Step 6: Open category picker
        await page.getByRole('button', { name: /add transaction/i }).click();
        await expect(
            page.getByTestId('transaction-form-dialog'),
        ).toBeVisible();

        await page.getByTestId('transaction-category-field').click();
        const options = page.getByRole('option');
        await expect(options.first()).toBeVisible();

        await page.screenshot({
            path: 'verification/e2e-inactivate-picker/03-picker-open.png',
        });

        // Step 7: Verify inactivated category not in picker options
        const optionTexts = await options.allTextContents();
        expect(
            optionTexts.some((text) =>
                text.includes('Inactivate Picker Test'),
            ),
        ).toBe(false);
        expect(
            optionTexts.some((text) => text.includes(categoryCode)),
        ).toBe(false);

        // Step 8: Verify test passes
        expect(consoleErrors).toEqual([]);
    });
});
