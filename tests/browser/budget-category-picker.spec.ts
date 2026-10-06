import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('Budget category picker active-only', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('feature 73: picker shows active C047 and excludes inactive C040', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page, request);

        // User has active C047 and inactive C040 (template).
        const createResponse = await request.post('/api/categories', {
            data: {
                name: 'Budget Picker Active Category',
                is_debt_category: false,
                is_income_category: false,
            },
        });
        expect(createResponse.status()).toBe(201);
        const created = await createResponse.json();
        expect(created.data.code).toBe('C047');
        expect(created.data.is_active).toBe(true);

        const inactiveCatalog = await request.get(
            '/api/categories?include_inactive=1',
        );
        expect(inactiveCatalog.ok()).toBeTruthy();
        const inactiveBody = await inactiveCatalog.json();
        expect(inactiveBody.data).toContainEqual(
            expect.objectContaining({
                code: 'C040',
                is_active: false,
            }),
        );

        // Capture the picker catalog request (no include_inactive).
        const categoriesRequestPromise = page.waitForRequest((req) => {
            if (req.method() !== 'GET') {
                return false;
            }
            const url = new URL(req.url());
            return (
                url.pathname === '/api/categories' &&
                !url.searchParams.has('include_inactive')
            );
        });

        await page.goto('/budgets');
        await expect(page).toHaveURL(/\/budgets$/);
        await expect(
            page.getByRole('heading', { name: 'Budgets' }),
        ).toBeVisible();

        const categoriesRequest = await categoriesRequestPromise;
        expect(categoriesRequest.url()).not.toContain('include_inactive');

        await page.screenshot({
            path: 'verification/budget-category-picker/page.png',
            fullPage: true,
        });

        // Open category picker.
        const categoryTrigger = page.getByTestId('budget-category-field');
        await expect(categoryTrigger).toBeVisible();
        await categoryTrigger.click();

        const options = page.getByRole('option');
        await expect(options.first()).toBeVisible();

        // Active C047 appears; inactive C040 does not.
        await expect(
            page.getByRole('option', {
                name: /C047 — Budget Picker Active Category/,
            }),
        ).toBeVisible();
        await expect(page.getByRole('option', { name: /C040/ })).toHaveCount(0);

        const optionTexts = await options.allTextContents();
        expect(optionTexts.some((text) => text.includes('C047'))).toBe(true);
        expect(optionTexts.some((text) => text.includes('C040'))).toBe(false);

        await page.screenshot({
            path: 'verification/budget-category-picker/picker-open.png',
        });

        // Create budget with active category successfully.
        await page
            .getByRole('option', {
                name: /C047 — Budget Picker Active Category/,
            })
            .click();
        await page.getByLabel('Budget Amount (CAD)').fill('125.50');
        await page.getByTestId('save-budget').click();
        await expect(page.getByTestId('budget-save-success')).toBeVisible();
        await expect(page.getByTestId('budget-row-C047')).toBeVisible();
        await expect(page.getByTestId('budget-row-C047')).toContainText(
            '125.5',
        );

        await page.screenshot({
            path: 'verification/budget-category-picker/budget-saved.png',
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
