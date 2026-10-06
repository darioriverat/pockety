import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const SHOT_DIR = 'verification/category-delete-hateoas';

test.describe('HATEOAS links on category delete response', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('feature 77: delete response includes links.index', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page, request);

        await page.goto('/categories');
        await expect(page.getByText('Total categories:')).toBeVisible();
        await page.screenshot({
            path: `${SHOT_DIR}/01-categories-page.png`,
            fullPage: true,
        });

        // Create a category without dependencies to delete
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();
        await page
            .getByLabel('Name', { exact: true })
            .fill('HATEOAS Delete Test');
        await page.getByRole('radio', { name: 'Expense', exact: true }).check();

        const createdWait = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/categories'),
        );
        await page.getByTestId('create-category-submit').click();
        const createResponse = await createdWait;
        expect(createResponse.status()).toBe(201);

        const createBody = (await createResponse.json()) as {
            data: { id: number; code: string; name: string };
        };
        const categoryCode = createBody.data.code;

        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
        await expect(
            page.getByTestId(`category-name-${categoryCode}`),
        ).toHaveText('HATEOAS Delete Test');
        await page.screenshot({
            path: `${SHOT_DIR}/02-category-created.png`,
            fullPage: true,
        });

        const dialogMessages: string[] = [];
        page.on('dialog', async (dialog) => {
            dialogMessages.push(dialog.message());
            await dialog.accept();
        });

        await page.screenshot({
            path: `${SHOT_DIR}/03-before-delete.png`,
        });

        const deleteWait = page.waitForResponse(
            (response) =>
                response.request().method() === 'DELETE' &&
                response.url().endsWith(`/api/categories/${categoryCode}`),
        );
        await page
            .getByTestId(`category-card-${categoryCode}`)
            .getByRole('button', {
                name: new RegExp(`delete ${categoryCode}`, 'i'),
            })
            .click();
        const deleteResponse = await deleteWait;
        await expect.poll(() => dialogMessages.length).toBe(1);
        expect(deleteResponse.status()).toBe(200);

        const deleteBody = (await deleteResponse.json()) as {
            message: string;
            links: { index: string };
        };

        // Verify response structure
        expect(deleteBody.message).toBeTruthy();
        expect(deleteBody.message).toContain('success');

        // Verify links.index
        expect(deleteBody.links.index).toBeTruthy();
        expect(deleteBody.links.index).toContain('/api/categories');

        // Follow links.index and verify it returns the category list
        const indexUrl = new URL(deleteBody.links.index, page.url());
        const followIndexResponse = await request.get(
            `${indexUrl.pathname}${indexUrl.search}`,
        );
        expect(followIndexResponse.status()).toBe(200);
        const followedIndex = await followIndexResponse.json();
        expect(followedIndex).toHaveProperty('data');
        expect(followedIndex).toHaveProperty('meta');
        expect(Array.isArray(followedIndex.data)).toBe(true);

        // Verify the deleted category is NOT in the list
        const foundCategory = followedIndex.data.find(
            (cat: { code: string }) => cat.code === categoryCode,
        );
        expect(foundCategory).toBeFalsy();

        await expect(
            page.getByTestId(`category-card-${categoryCode}`),
        ).toHaveCount(0);
        await page.screenshot({
            path: `${SHOT_DIR}/04-category-deleted.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
