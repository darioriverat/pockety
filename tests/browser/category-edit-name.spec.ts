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

test('feature 7: update category name through edit dialog', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const createResponse = await request.post('/api/categories', {
        data: {
            name: 'Edit Name Target',
            is_debt_category: false,
            is_income_category: false,
        },
    });
    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()) as {
        data: { code: string; name: string; is_debt_category: boolean; is_income_category: boolean; is_active: boolean };
    };
    const code = created.data.code;

    await page.goto('/categories');
    await expect(page.getByTestId(`category-name-${code}`)).toHaveText(
        'Edit Name Target',
    );
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-name-before.png',
        fullPage: true,
    });

    await page.getByTestId(`edit-category-${code}`).click();
    await expect(page.getByTestId('edit-category-dialog')).toBeVisible();
    await expect(page.getByTestId('edit-category-name-input')).toHaveValue(
        'Edit Name Target',
    );

    await page.getByTestId('edit-category-name-input').fill('Updated Name');
    await page.screenshot({
        path: 'verification/category-edit-name-dialog.png',
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
            name: string;
            code: string;
            is_debt_category: boolean;
            is_income_category: boolean;
            is_active: boolean;
        };
        links: { self: string; index: string };
    };

    expect(payload.data.name).toBe('Updated Name');
    expect(payload.data.code).toBe(code);
    expect(payload.data.is_debt_category).toBe(false);
    expect(payload.data.is_income_category).toBe(false);
    expect(payload.data.is_active).toBe(true);
    expect(payload.links.self).toContain(`/api/categories/${code}`);
    expect(payload.links.index).toContain('/api/categories');

    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await expect(page.getByTestId(`category-name-${code}`)).toHaveText(
        'Updated Name',
    );
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-name-after.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
