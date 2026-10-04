import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 8: update category flags when no transactions exist', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const createResponse = await request.post('/api/categories', {
        data: {
            name: 'Flag Change Target',
            is_debt_category: false,
            is_income_category: false,
        },
    });
    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()) as {
        data: {
            code: string;
            name: string;
            is_debt_category: boolean;
            is_income_category: boolean;
            is_active: boolean;
        };
    };
    const code = created.data.code;
    expect(created.data.is_debt_category).toBe(false);

    const transactionsResponse = await request.get(
        `/api/categories/${code}/transactions`,
    );
    expect(transactionsResponse.ok()).toBeTruthy();
    const transactionsBody = (await transactionsResponse.json()) as {
        data: unknown[];
    };
    expect(transactionsBody.data).toEqual([]);

    await page.goto('/categories');
    await expect(page.getByTestId(`category-name-${code}`)).toHaveText(
        'Flag Change Target',
    );
    await expect(page.getByTestId(`debt-badge-${code}`)).toHaveCount(0);
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-flags-before.png',
        fullPage: true,
    });

    await page.getByTestId(`edit-category-${code}`).click();
    await expect(page.getByTestId('edit-category-dialog')).toBeVisible();
    await expect(page.getByTestId('edit-kind-debt')).toBeEnabled();
    await expect(page.getByTestId('edit-kind-locked-message')).toHaveCount(0);

    await page.getByTestId('edit-kind-debt').check();
    await page.screenshot({
        path: 'verification/category-edit-flags-dialog.png',
    });

    const updated = page.waitForResponse(
        (response) =>
            response.request().method() === 'PUT' &&
            response.url().endsWith(`/api/categories/${code}`),
    );
    await page.getByTestId('edit-category-submit').click();
    const response = await updated;
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as {
        data: {
            code: string;
            name: string;
            is_debt_category: boolean;
            is_income_category: boolean;
            is_active: boolean;
        };
        links: { self: string; index: string };
    };

    expect(payload.data.code).toBe(code);
    expect(payload.data.name).toBe('Flag Change Target');
    expect(payload.data.is_debt_category).toBe(true);
    expect(payload.data.is_income_category).toBe(false);
    expect(payload.data.is_active).toBe(true);
    expect(payload.links.self).toContain(`/api/categories/${code}`);
    expect(payload.links.index).toContain('/api/categories');

    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await expect(page.getByTestId(`debt-badge-${code}`)).toHaveText('Debt');
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-flags-after.png',
        fullPage: true,
    });

    const stillEmpty = await request.get(`/api/categories/${code}/transactions`);
    expect(stillEmpty.ok()).toBeTruthy();
    const stillEmptyBody = (await stillEmpty.json()) as { data: unknown[] };
    expect(stillEmptyBody.data).toEqual([]);

    expect(consoleErrors).toEqual([]);
});
