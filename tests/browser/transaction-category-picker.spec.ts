import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('Transaction category picker active-only', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('feature 72: picker shows active C047 and excludes inactive C040', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page, request);

        // Step 2: User has active C047 and inactive C040 (template).
        const createResponse = await request.post('/api/categories', {
            data: {
                name: 'Picker Active Category',
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

        // Step 7: Capture the picker catalog request (no include_inactive).
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

        // Step 3: Navigate to transaction creation page.
        await page.goto('/transactions');
        await expect(page).toHaveURL(/\/transactions$/);
        await expect(
            page.getByRole('heading', { name: 'Transactions' }),
        ).toBeVisible();

        const categoriesRequest = await categoriesRequestPromise;
        expect(categoriesRequest.url()).not.toContain('include_inactive');

        await page.screenshot({
            path: 'verification/transaction-category-picker/page.png',
            fullPage: true,
        });

        // Step 4: Open category picker/dropdown.
        await page.getByRole('button', { name: 'Add Transaction' }).click();
        await expect(
            page.getByTestId('transaction-form-dialog'),
        ).toBeVisible();

        const categoryTrigger = page.getByTestId('transaction-category-field');
        await expect(categoryTrigger).toBeVisible();
        await categoryTrigger.click();

        const options = page.getByRole('option');
        await expect(options.first()).toBeVisible();

        // Step 5: Verify C047 appears in picker.
        await expect(
            page.getByRole('option', {
                name: /C047 - Picker Active Category/,
            }),
        ).toBeVisible();

        // Step 6: Verify C040 does not appear in picker.
        await expect(
            page.getByRole('option', { name: /C040/ }),
        ).toHaveCount(0);

        const optionTexts = await options.allTextContents();
        expect(optionTexts.some((text) => text.includes('C047'))).toBe(true);
        expect(optionTexts.some((text) => text.includes('C040'))).toBe(false);

        await page.screenshot({
            path: 'verification/transaction-category-picker/picker-open.png',
        });

        expect(consoleErrors).toEqual([]);
    });
});
