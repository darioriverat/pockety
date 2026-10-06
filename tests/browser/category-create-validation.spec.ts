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

test('conflicting category flags are rejected by the server and shown inside the dialog', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/categories');
    await page.getByTestId('create-category-button').click();
    await page.getByLabel('Name', { exact: true }).fill('Invalid');
    await page.getByRole('radio', { name: 'Debt', exact: true }).check();
    await expect(
        page.getByRole('radio', { name: 'Income', exact: true }),
    ).not.toBeChecked();
    await page.screenshot({
        path: 'verification/category-validation-input.png',
    });

    // The kind radio group prevents this payload normally. Corrupt only the
    // outgoing UI request to exercise the real server's defensive validation.
    await page.route(
        '**/api/categories',
        async (route) => {
            if (route.request().method() !== 'POST') return route.continue();
            await route.continue({
                postData: JSON.stringify({
                    ...route.request().postDataJSON(),
                    is_debt_category: true,
                    is_income_category: true,
                }),
            });
        },
        { times: 1 },
    );
    const rejected = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith('/api/categories'),
    );
    await page.getByTestId('create-category-submit').click();
    const response = await rejected;
    expect(response.status()).toBe(422);
    expect(await response.json()).toMatchObject({
        error: 'A category cannot be both debt and income',
    });
    await expect(page.getByRole('alert')).toHaveText(
        'A category cannot be both debt and income',
    );
    await expect(page.getByTestId('create-category-dialog')).toBeVisible();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
        'Invalid',
    );
    await page.screenshot({
        path: 'verification/category-validation-rejected.png',
    });
    await page.getByTestId('create-category-cancel').click();
    await expect(page.getByText('Total categories: 47')).toBeVisible();
    await expect(page.getByText('Invalid', { exact: true })).toHaveCount(0);

    await page.getByTestId('create-category-button').click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByLabel('Name', { exact: true }).fill('Valid Expense');
    await page.getByRole('radio', { name: 'Expense', exact: true }).check();
    const created = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith('/api/categories'),
    );
    await page.getByTestId('create-category-submit').click();
    const success = await created;
    expect(success.status()).toBe(201);
    expect((await success.json()).data).toMatchObject({
        code: 'C047',
        is_debt_category: false,
        is_income_category: false,
    });
    await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
    await expect(page.getByTestId('category-name-C047')).toHaveText(
        'Valid Expense',
    );
    await page.getByTestId('category-card-C047').scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-validation-recovered.png',
    });
    await page.reload();
    await expect(page.getByText('Total categories: 48')).toBeVisible();
    await expect(page.getByText('Invalid', { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('field validation is visible and can be corrected without closing the dialog', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categories');
    await page.getByTestId('create-category-button').click();
    await page.getByLabel('Name', { exact: true }).fill('   ');
    await page.getByTestId('create-category-submit').click();
    await expect(page.getByRole('alert')).toContainText(
        'name field is required',
    );
    await page.screenshot({
        path: 'verification/category-validation-mobile.png',
    });
    await page.getByLabel('Name', { exact: true }).fill('Corrected Expense');
    await page.getByTestId('create-category-submit').click();
    await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
    await expect(page.getByTestId('category-name-C047')).toHaveText(
        'Corrected Expense',
    );
    expect(errors).toEqual([]);
});
