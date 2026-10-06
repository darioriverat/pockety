import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { trackConsoleErrors } from './helpers';

test.describe('Browser test for category create workflow', () => {
    test('complete category create workflow - 10 steps', async ({ page }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Steps 1–2: isolated registration (unique user owns a fresh template
        // catalog). Avoid migrate:fresh / shared BrowserTestSeeder user so a
        // polluted shared DB cannot steal C047 or collide on category names.
        await page.goto('/register');
        await page
            .getByLabel('Name', { exact: true })
            .fill('Category Create Workflow');
        await page
            .getByLabel('Email address')
            .fill(`create-workflow-${randomUUID()}@example.com`);
        await page
            .getByLabel('Password', { exact: true })
            .fill('Create-workflow-102!');
        await page.getByLabel('Confirm password').fill('Create-workflow-102!');
        await page
            .getByRole('button', { name: 'Create account', exact: true })
            .click();
        await expect(page).toHaveURL(/\/dashboard$/);

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
            animations: 'disabled',
        });

        // Step 6: Submit form
        let fullPageReloads = 0;
        page.on('framenavigated', (frame) => {
            if (frame === page.mainFrame()) {
                fullPageReloads += 1;
            }
        });
        const createResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/categories'),
        );
        await page.getByTestId('create-category-submit').click();
        const createResponse = await createResponsePromise;
        expect(createResponse.status()).toBe(201);
        const { data: category } = (await createResponse.json()) as {
            data: { code: string; name: string };
        };
        expect(category).toMatchObject({
            code: 'C047',
            name: 'Browser Test Category',
        });

        // Step 7: Wait for new category card to appear
        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);

        // Step 8: Verify category visible on page
        await expect(
            page.getByTestId(`category-card-${category.code}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`category-name-${category.code}`),
        ).toContainText('Browser Test Category');
        await expect(page.getByText('Total categories: 48')).toBeVisible();

        await page.screenshot({
            path: 'verification/e2e-create-workflow/02-category-created.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Step 9: Verify no page reload occurred (reactive list update only)
        expect(fullPageReloads).toBe(0);

        // Step 10: Close browser and verify test passes
        expect(consoleErrors).toEqual([]);
    });
});
