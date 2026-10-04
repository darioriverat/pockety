import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.describe('Browser test for category edit workflow', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('complete category edit workflow - 7 steps', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Step 1: Setup test with seeded category
        await loginAsBrowserTestUser(page, request);

        // Create a test category first
        const createResponse = await request.post('/api/categories', {
            data: {
                name: 'Edit Workflow Test',
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
        await expect(page.getByTestId(`category-card-${categoryCode}`)).toBeVisible();

        await page.screenshot({
            path: 'verification/e2e-edit-workflow/01-before-edit.png',
            fullPage: true,
        });

        // Step 3: Click edit on test category
        await page.getByTestId(`edit-category-${categoryCode}`).click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();
        await expect(
            page.getByTestId('edit-category-name-input'),
        ).toHaveValue('Edit Workflow Test');

        // Step 4: Modify name in dialog
        await page.getByTestId('edit-category-name-input').fill('');
        await page
            .getByTestId('edit-category-name-input')
            .fill('Edit Workflow Test Updated');

        await page.screenshot({
            path: 'verification/e2e-edit-workflow/02-edit-dialog.png',
        });

        // Step 5: Submit changes
        const updateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith(`/api/categories/${categoryCode}`),
        );
        await page.getByTestId('edit-category-submit').click();
        const updateResponse = await updateResponsePromise;
        expect(updateResponse.status()).toBe(200);

        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);

        // Step 6: Verify category name updated on page
        await expect(
            page.getByTestId(`category-name-${categoryCode}`),
        ).toContainText('Edit Workflow Test Updated');

        await page.screenshot({
            path: 'verification/e2e-edit-workflow/03-after-edit.png',
            fullPage: true,
        });

        // Step 7: Verify test passes
        expect(consoleErrors).toEqual([]);
    });
});
