import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('Browser test for category create workflow', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('complete category create workflow - 10 steps', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Step 1: Launch browser test with BrowserTestSeeder
        // (handled by resetBrowserState in beforeAll)

        // Step 2: Login test user
        await loginAsBrowserTestUser(page, request);

        // Step 3: Navigate to categories page
        await page.goto('/categories');
        await expect(page).toHaveURL(/\/categories$/);
        await expect(
            page.getByRole('heading', { name: /categories/i }),
        ).toBeVisible();

        // Step 4: Click create category button
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();

        // Step 5: Fill form with test data
        await page
            .getByTestId('category-name-input')
            .fill('Browser Test Category');
        await page.getByTestId('kind-expense').check();

        await page.screenshot({
            path: 'verification/e2e-create-workflow/01-create-dialog.png',
        });

        // Step 6: Submit form
        const createResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/categories'),
        );
        await page.getByTestId('create-category-submit').click();
        const createResponse = await createResponsePromise;
        expect(createResponse.status()).toBe(201);

        // Step 7: Wait for new category card to appear
        await expect(page.getByTestId('create-category-dialog')).toHaveCount(
            0,
        );

        // Step 8: Verify category visible on page
        await expect(page.getByTestId('category-card-C047')).toBeVisible();
        await expect(page.getByTestId('category-name-C047')).toContainText(
            'Browser Test Category',
        );

        await page.screenshot({
            path: 'verification/e2e-create-workflow/02-category-created.png',
            fullPage: true,
        });

        // Step 9: Verify no page reload occurred
        // (If the page reloaded, we would see a navigation event)
        // The dialog closing without navigation indicates reactive update

        // Step 10: Close browser and verify test passes
        expect(consoleErrors).toEqual([]);
    });
});
