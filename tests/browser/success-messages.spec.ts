import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Feature #118 — success toast after create/update/delete.
 * Single login to avoid Fortify login throttle (5/min).
 */
test('success messages after create, update, and delete', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);

    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categoriesPayload = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string; name_en: string }>;
    };
    const c001 = categoriesPayload.data.find((item) => item.code === 'C001');
    expect(c001).toBeTruthy();

    // Seed a transaction for update/delete via API
    const createResponse = await request.post('/api/transactions', {
        data: {
            date: '2025-01-21',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 40,
            comments: 'Toast flow source',
        },
    });
    expect(createResponse.ok()).toBeTruthy();
    const seeded = (await createResponse.json()) as { data: { id: number } };

    await page.goto('/transactions');
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'January 2025', exact: true }).click();
    await expect(page.getByTestId('transactions-heading')).toBeVisible();

    // CREATE via UI
    await page.getByRole('button', { name: /add transaction/i }).click();
    await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();
    await page.getByTestId('transaction-date-input').fill('2025-01-20');
    await expect(page.getByTestId('transaction-period-input')).toHaveValue(
        '202501',
    );
    await page.getByRole('combobox', { name: 'Category' }).click();
    await page.getByRole('option', { name: /Groceries|MERCADO/ }).click();
    await page.getByTestId('transaction-amount-input').fill('50.00');
    await page.getByTestId('transaction-form-submit').click();

    await expect(
        page.getByText('Transaction created successfully'),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);

    await page.screenshot({
        path: 'verification/test-118-success-messages/01-create-success.png',
        fullPage: true,
    });

    // UPDATE seeded transaction
    await expect(
        page.getByTestId(`transaction-row-${seeded.data.id}`),
    ).toBeVisible({ timeout: 10000 });
    await page
        .getByTestId(`transaction-row-${seeded.data.id}`)
        .getByTestId('edit-transaction-button')
        .click();
    await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();
    await page.getByTestId('transaction-amount-input').fill('75.00');
    await page.getByTestId('transaction-form-submit').click();

    await expect(
        page.getByText('Transaction updated successfully'),
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({
        path: 'verification/test-118-success-messages/02-update-success.png',
        fullPage: true,
    });

    // DELETE seeded transaction via confirmation dialog
    await page
        .getByTestId(`transaction-row-${seeded.data.id}`)
        .getByTestId('delete-transaction-button')
        .click();
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();
    await page.getByTestId('delete-confirm-button').click();

    await expect(
        page.getByText('Transaction deleted successfully'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
        page.getByTestId(`transaction-row-${seeded.data.id}`),
    ).toHaveCount(0);

    await page.screenshot({
        path: 'verification/test-118-success-messages/03-delete-success.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
