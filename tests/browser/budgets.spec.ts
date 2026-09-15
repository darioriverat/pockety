import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 57-61: budgets page supports set budget and vs-actual report', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Ensure exchange rates exist for multi-currency conversion
    await request.post('/api/exchange-rates', {
        data: {
            period: '202501',
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });

    const categoriesResponse = await request.get('/api/categories');
    const categoriesPayload = await categoriesResponse.json();
    const categories: ApiCategory[] = categoriesPayload.data;
    const c001 = categories.find((category) => category.code === 'C001');
    expect(c001).toBeTruthy();

    // Create under-budget actuals (CAD 750)
    await request.post('/api/transactions', {
        data: {
            date: '2025-01-10',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 400,
            comments: 'Budget test CAD 1',
        },
    });
    await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: c001!.id,
            amount_cad: 350,
            comments: 'Budget test CAD 2',
        },
    });

    await page.goto('/budgets');
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Save Budget' }),
    ).toBeVisible();
    await expect(page.getByTestId('budget-vs-actual-table')).toBeVisible();
    await expect(page.getByLabel('Period')).toBeVisible();
    await expect(page.getByLabel('Category')).toBeVisible();
    await expect(page.getByLabel('Budget Amount (CAD)')).toBeVisible();

    await page.getByLabel('Budget Amount (CAD)').fill('800');
    await page.getByTestId('save-budget').click();

    await expect(page.getByTestId('budget-save-success')).toBeVisible();
    await expect(page.getByTestId('budget-total')).toContainText('800');

    const c001Row = page.getByTestId('budget-row-C001');
    await expect(c001Row).toBeVisible();
    await expect(c001Row).toContainText('800');
    await expect(c001Row).toContainText('750');
    await expect(c001Row).toContainText('93.75%');
    await expect(c001Row).toContainText('Under budget');
    await expect(c001Row).toHaveAttribute('data-over-budget', 'false');

    // Push category over budget (additional CAD 150 → actual 900)
    await request.post('/api/transactions', {
        data: {
            date: '2025-01-25',
            period: '202501',
            quincena: 'Q2',
            category_id: c001!.id,
            amount_cad: 150,
            comments: 'Budget overspend',
        },
    });

    await page.reload();
    await expect(page.getByTestId('budget-row-C001')).toContainText('900');
    await expect(page.getByTestId('budget-row-C001')).toContainText('112.50%');
    await expect(page.getByTestId('budget-row-C001')).toContainText(
        'Over budget',
    );
    await expect(page.getByTestId('budget-row-C001')).toHaveAttribute(
        'data-over-budget',
        'true',
    );
    await expect(page.getByTestId('over-budget-count')).toContainText('1');

    expect(consoleErrors).toEqual([]);
});

test('feature 97: Budget form validates that budget amount is a positive number', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Step 1: Navigate to budget form
    await page.goto('/budgets');
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
    await expect(page.getByLabel('Budget Amount (CAD)')).toBeVisible();

    // Select period
    const periodSelector = page.getByTestId('page-period-selector');
    await periodSelector.click();
    await page.getByRole('option', { name: /January 2025/i }).click();

    // Step 2: Enter negative budget amount
    await page.getByLabel('Budget Amount (CAD)').clear();
    await page.getByLabel('Budget Amount (CAD)').fill('-100');

    await page.getByTestId('save-budget').click();

    // Step 3: Verify validation error is shown
    await expect(
        page.getByText(/must be a positive number/i)
    ).toBeVisible();

    // Error should remain visible
    await expect(page.getByText(/must be a positive number/i)).toBeVisible();

    // Try zero as well (also invalid)
    await page.getByLabel('Budget Amount (CAD)').clear();
    await page.getByLabel('Budget Amount (CAD)').fill('0');

    await page.getByTestId('save-budget').click();

    // Verify zero is also rejected
    await expect(
        page.getByText(/must be a positive number/i)
    ).toBeVisible();

    // Step 4: Enter positive amount
    await page.getByLabel('Budget Amount (CAD)').clear();
    await page.getByLabel('Budget Amount (CAD)').fill('800');

    await page.getByTestId('save-budget').click();

    // Step 5: Verify form accepts positive amount
    await expect(page.getByTestId('budget-save-success')).toBeVisible();

    // Verify no error messages
    await expect(page.getByText(/must be a positive number/i)).not.toBeVisible();

    expect(consoleErrors).toEqual([]);
});
