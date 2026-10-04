import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const SHOT_DIR = 'verification/category-update-hateoas';

test.describe('HATEOAS links on category update response', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('feature 76: update response includes links.self and links.index', async ({
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

        // Create a category first
        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();
        await page.getByLabel('Name', { exact: true }).fill('HATEOAS Update Test');
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
        ).toHaveText('HATEOAS Update Test');
        await page.screenshot({
            path: `${SHOT_DIR}/02-category-created.png`,
            fullPage: true,
        });

        // Edit the category
        await page.getByTestId(`category-edit-${categoryCode}`).click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();
        await page.getByLabel('Name', { exact: true }).clear();
        await page.getByLabel('Name', { exact: true }).fill('HATEOAS Updated Name');
        await page.screenshot({
            path: `${SHOT_DIR}/03-edit-dialog.png`,
        });

        const updateWait = page.waitForResponse(
            (response) =>
                response.request().method() === 'PUT' &&
                response.url().endsWith(`/api/categories/${categoryCode}`),
        );
        await page.getByTestId('edit-category-submit').click();
        const updateResponse = await updateWait;
        expect(updateResponse.status()).toBe(200);

        const updateBody = (await updateResponse.json()) as {
            data: {
                id: number;
                code: string;
                name: string;
                is_active: boolean;
            };
            links: { self: string; index: string };
        };

        // Verify response structure
        expect(updateBody.data).toMatchObject({
            code: categoryCode,
            name: 'HATEOAS Updated Name',
            is_active: true,
        });

        // Verify links.self
        expect(updateBody.links.self).toBeTruthy();
        expect(updateBody.links.self).toContain(categoryCode);
        expect(updateBody.links.self).toContain(`/api/categories/${categoryCode}`);

        // Verify links.index
        expect(updateBody.links.index).toBeTruthy();
        expect(updateBody.links.index).toContain('/api/categories');

        // Follow links.self and verify it returns the same category
        const selfUrl = new URL(updateBody.links.self, page.url());
        const followSelfResponse = await request.get(
            `${selfUrl.pathname}${selfUrl.search}`,
        );
        expect(followSelfResponse.status()).toBe(200);
        const followedSelf = await followSelfResponse.json();
        expect(followedSelf.data).toMatchObject({
            id: updateBody.data.id,
            code: categoryCode,
            name: 'HATEOAS Updated Name',
        });

        // Follow links.index and verify it returns the category list
        const indexUrl = new URL(updateBody.links.index, page.url());
        const followIndexResponse = await request.get(
            `${indexUrl.pathname}${indexUrl.search}`,
        );
        expect(followIndexResponse.status()).toBe(200);
        const followedIndex = await followIndexResponse.json();
        expect(followedIndex).toHaveProperty('data');
        expect(followedIndex).toHaveProperty('meta');
        expect(Array.isArray(followedIndex.data)).toBe(true);

        // Verify the updated category is in the list
        const foundCategory = followedIndex.data.find(
            (cat: { code: string; name: string }) => cat.code === categoryCode,
        );
        expect(foundCategory).toBeTruthy();
        expect(foundCategory.name).toBe('HATEOAS Updated Name');

        // Verify UI updated
        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
        await expect(
            page.getByTestId(`category-name-${categoryCode}`),
        ).toHaveText('HATEOAS Updated Name');
        await page
            .getByTestId(`category-card-${categoryCode}`)
            .scrollIntoViewIfNeeded();
        await page.screenshot({
            path: `${SHOT_DIR}/04-category-updated.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
