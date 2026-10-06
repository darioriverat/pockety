import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser } from './helpers';

test.describe('per-user ownership foundation', () => {
    test('authenticated categories API and page work for the signed-in user', async ({
        page,
    }) => {
        await loginAsBrowserTestUser(page);
        await page.goto('/categories');
        await expect(
            page.getByRole('heading', { name: /categories/i }),
        ).toBeVisible();

        const api = await page.request.get('/api/categories');
        expect(api.status()).toBe(200);
        const body = await api.json();
        expect(Array.isArray(body.data)).toBeTruthy();
        expect(body.data.length).toBeGreaterThanOrEqual(46);

        await page.screenshot({
            path: 'verification/user-ownership/categories-page.png',
            fullPage: true,
        });
    });

    test('unauthenticated API calls receive 401', async ({
        playwright,
        baseURL,
    }) => {
        const context = await playwright.request.newContext({
            baseURL,
            storageState: { cookies: [], origins: [] },
        });
        const response = await context.get('/api/categories');
        expect(response.status()).toBe(401);
        await context.dispose();
    });

    test('creating a category assigns ownership for the signed-in user', async ({
        page,
    }) => {
        await loginAsBrowserTestUser(page);
        await page.goto('/categories');

        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Ownership Probe');
        await page.getByTestId('kind-expense').click();
        await page.getByTestId('create-category-submit').click();

        await expect(page.getByText('Ownership Probe')).toBeVisible({
            timeout: 10000,
        });
        await page.screenshot({
            path: 'verification/user-ownership/create-category.png',
            fullPage: true,
        });
    });
});
