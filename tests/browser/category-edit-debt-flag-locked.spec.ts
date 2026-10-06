import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeEach(async ({ page, request }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page, request);
});

test('feature 9: reject debt flag change when transactions exist', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    // Step 1: Create expense category
    const createResponse = await request.post('/api/categories', {
        data: {
            name: 'Debt Lock Target',
            is_debt_category: false,
            is_income_category: false,
        },
    });
    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()) as {
        data: {
            id: number;
            code: string;
            name: string;
            is_debt_category: boolean;
            is_income_category: boolean;
            is_active: boolean;
        };
    };
    const code = created.data.code;
    const categoryId = created.data.id;
    expect(created.data.is_debt_category).toBe(false);

    // Step 2: Create transaction with this category_id
    const transactionResponse = await request.post('/api/transactions', {
        data: {
            date: '2026-01-15',
            period: '202601',
            category_id: categoryId,
            amount_cad: 42.5,
            comments: 'Locks debt flag change',
        },
    });
    expect(transactionResponse.ok()).toBeTruthy();

    // Step 3-5: Attempt PUT changing is_debt_category → 422 with exact message
    const updateResponse = await request.put(`/api/categories/${code}`, {
        data: {
            is_debt_category: true,
        },
    });
    expect(updateResponse.status()).toBe(422);
    const updateBody = (await updateResponse.json()) as {
        error?: string;
        message?: string;
    };
    expect(updateBody.error ?? updateBody.message).toBe(
        'Debt and income settings cannot be changed because this category has transactions',
    );

    // Step 6: Verify category unchanged
    const getResponse = await request.get('/api/categories?include_inactive=1');
    expect(getResponse.ok()).toBeTruthy();
    const list = (await getResponse.json()) as {
        data: Array<{
            code: string;
            is_debt_category: boolean;
            is_income_category: boolean;
            name: string;
        }>;
    };
    const unchanged = list.data.find((item) => item.code === code);
    expect(unchanged).toBeTruthy();
    expect(unchanged!.is_debt_category).toBe(false);
    expect(unchanged!.is_income_category).toBe(false);
    expect(unchanged!.name).toBe('Debt Lock Target');

    // UI: edit dialog locks kind radios when transactions exist
    await page.goto('/categories');
    await expect(page.getByTestId(`category-name-${code}`)).toHaveText(
        'Debt Lock Target',
    );
    await expect(page.getByTestId(`debt-badge-${code}`)).toHaveCount(0);
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-debt-flag-locked-before.png',
        fullPage: true,
    });

    await page.getByTestId(`edit-category-${code}`).click();
    await expect(page.getByTestId('edit-category-dialog')).toBeVisible();
    await expect(page.getByTestId('edit-kind-locked-message')).toBeVisible();
    await expect(page.getByTestId('edit-kind-expense')).toBeDisabled();
    await expect(page.getByTestId('edit-kind-debt')).toBeDisabled();
    await expect(page.getByTestId('edit-kind-income')).toBeDisabled();
    await page.screenshot({
        path: 'verification/category-edit-debt-flag-locked-dialog.png',
    });

    // Name update still allowed; kind stays expense
    await page
        .getByTestId('edit-category-name-input')
        .fill('Debt Lock Target Kept');
    const nameUpdate = page.waitForResponse(
        (response) =>
            response.request().method() === 'PUT' &&
            response.url().endsWith(`/api/categories/${code}`),
    );
    await page.getByTestId('edit-category-submit').click();
    const nameResponse = await nameUpdate;
    expect(nameResponse.status()).toBe(200);
    const namePayload = (await nameResponse.json()) as {
        data: {
            code: string;
            name: string;
            is_debt_category: boolean;
            is_income_category: boolean;
        };
    };
    expect(namePayload.data.name).toBe('Debt Lock Target Kept');
    expect(namePayload.data.is_debt_category).toBe(false);
    expect(namePayload.data.is_income_category).toBe(false);

    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await expect(page.getByTestId(`category-name-${code}`)).toHaveText(
        'Debt Lock Target Kept',
    );
    await expect(page.getByTestId(`debt-badge-${code}`)).toHaveCount(0);
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-debt-flag-locked-after.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
