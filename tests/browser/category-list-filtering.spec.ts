import { test, expect } from '@playwright/test';
import { loginAsBrowserTestUser, resetBrowserState } from './helpers';

test.describe('Category List Filtering', () => {
    test.beforeEach(() => {
        resetBrowserState();
    });

    test('GET /api/categories returns only active categories by default (Feature #14)', async ({
        page,
        request,
    }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: Create two categories
        await page.goto('/categories');

        // Create first category
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Active Category');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        // Create second category
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('To Be Inactive');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        // Step 2: Inactivate one category (C048)
        await page.getByTestId('edit-category-C048').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();
        await page.getByTestId('edit-category-active').click();
        await page.getByTestId('edit-category-submit').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeHidden();

        // Verify the inactive category shows as retired on the UI
        const inactiveCategoryCard = page.getByTestId('category-card-C048');
        await expect(inactiveCategoryCard.getByText('Retired')).toBeVisible();

        // Step 3: GET /api/categories without parameters
        const response = await request.get('/api/categories');

        // Step 4: Verify response includes only active categories
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        const codes = body.data.map((cat: any) => cat.code);

        // Step 5: Verify meta.total matches active count
        // Template has 46 active + 1 custom active (C047) = 47 active
        expect(body.meta.total).toBe(47);

        // Step 6: Verify inactive category not in response
        expect(codes).toContain('C047'); // Active custom category
        expect(codes).not.toContain('C048'); // Inactive category
        expect(codes).not.toContain('C040'); // Inactive template category
    });

    test('GET /api/categories?include_inactive=1 returns all categories (Feature #15)', async ({
        page,
        request,
    }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: Seed database with active and inactive categories (template already has this)
        // Step 2: Note C040 is inactive in template
        // Template has 46 active categories + C040 inactive = 47 total

        // Step 3: GET /api/categories?include_inactive=1
        const response = await request.get(
            '/api/categories?include_inactive=1',
        );

        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        const codes = body.data.map((cat: any) => cat.code);

        // Step 4: Verify response includes both active and inactive
        // Step 5: Verify C040 appears in results
        expect(codes).toContain('C040'); // Inactive template category
        expect(codes).toContain('C001'); // Active template category
        expect(codes).toContain('I01'); // Active income category

        // Step 6: Verify all returned categories ordered by code
        // Verify ordering: codes should be in ascending order
        for (let i = 1; i < codes.length; i++) {
            expect(codes[i] > codes[i - 1]).toBeTruthy();
        }

        // Verify total includes inactive categories
        // Template has 47 total (46 active + 1 inactive)
        expect(body.meta.total).toBe(47);
    });
});
