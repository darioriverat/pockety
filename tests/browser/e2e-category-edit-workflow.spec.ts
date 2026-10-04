import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { trackConsoleErrors } from './helpers';

test.describe('Browser test for category edit workflow', () => {
    test('complete category edit workflow - 7 steps', async ({ page }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        // Step 1: Setup with an isolated user + fresh template catalog.
        // Avoid migrate:fresh / shared BrowserTestSeeder so the shared
        // development database is not wiped between sessions.
        await page.goto('/register');
        await page
            .getByLabel('Name', { exact: true })
            .fill('Category Edit Workflow');
        await page
            .getByLabel('Email address')
            .fill(`edit-workflow-${randomUUID()}@example.com`);
        await page
            .getByLabel('Password', { exact: true })
            .fill('Edit-workflow-103!');
        await page
            .getByLabel('Confirm password')
            .fill('Edit-workflow-103!');
        await page
            .getByRole('button', { name: 'Create account', exact: true })
            .click();
        await expect(page).toHaveURL(/\/dashboard$/);

        // Create the category to edit through the real UI (seeded category).
        await page.goto('/categories');
        await expect(page).toHaveURL(/\/categories$/);
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();
        await page
            .getByTestId('category-name-input')
            .fill('Edit Workflow Test');
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
            data: { code: string; name: string };
        };
        expect(created.code).toMatch(/^C\d{3,}$/);
        await expect(page.getByTestId('create-category-dialog')).toHaveCount(
            0,
        );
        await expect(
            page.getByTestId(`category-card-${created.code}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`category-name-${created.code}`),
        ).toContainText('Edit Workflow Test');

        // Step 2: Login and navigate to categories (already on page)
        await page
            .getByTestId(`category-card-${created.code}`)
            .scrollIntoViewIfNeeded();
        await page.screenshot({
            path: 'verification/e2e-edit-workflow/01-before-edit.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Step 3: Click edit on test category
        await page.getByTestId(`edit-category-${created.code}`).click();
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
            animations: 'disabled',
        });

        // Step 5: Submit changes
        const updateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith(`/api/categories/${created.code}`),
        );
        await page.getByTestId('edit-category-submit').click();
        const updateResponse = await updateResponsePromise;
        expect(updateResponse.status()).toBe(200);
        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);

        // Step 6: Verify category name updated on page
        await expect(
            page.getByTestId(`category-name-${created.code}`),
        ).toContainText('Edit Workflow Test Updated');
        await page
            .getByTestId(`category-card-${created.code}`)
            .scrollIntoViewIfNeeded();

        await page.screenshot({
            path: 'verification/e2e-edit-workflow/03-after-edit.png',
            fullPage: true,
            animations: 'disabled',
        });

        // Step 7: Verify test passes
        expect(consoleErrors).toEqual([]);
    });
});
