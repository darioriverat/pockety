import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
    ensureExchangeRateForPeriod,
} from './helpers';

test.beforeEach(() => {
    resetBrowserState();
});

test('user can register a period balance from reconciliation figures and overwrite it', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page, request);

    await ensureExchangeRateForPeriod(request, '202501', {
        copPerUsd: 4400,
        cadPerUsd: 0.75,
    });

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'Period Balance Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()).data;

    const balanceResponse = await request.post(
        `/api/accounts/${bank.id}/balances`,
        {
            data: {
                period: '202501',
                recorded_balance_cad: 1000,
                recorded_balance_usd: 0,
                recorded_balance_cop: 0,
            },
        },
    );
    expect(balanceResponse.ok()).toBeTruthy();

    const categoriesResponse = await request.get('/api/categories');
    const categories: ApiCategory[] = (await categoriesResponse.json()).data;
    const groceries = categories.find((category) => category.code === 'C001');
    expect(groceries).toBeTruthy();

    const transactionResponse = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            category_id: groceries!.id,
            account_id: bank.id,
            amount_cad: 100,
            comments: 'period-balance-groceries',
        },
    });
    expect(transactionResponse.ok()).toBeTruthy();

    await page.goto('/reconciliation');
    await expect(
        page.getByRole('heading', { name: 'Reconciliation' }),
    ).toBeVisible();
    await expect(page.getByTestId('register-period-balance')).toHaveCount(0);

    await page.goto('/period-balances');
    await expect(page.getByTestId('period-balances-heading')).toBeVisible();
    await page.getByTestId('page-period-selector').click();
    await page
        .getByRole('option', { name: 'January 2025', exact: true })
        .click();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'January 2025',
    );
    await expect(page.getByTestId('proposed-assets-cad')).toHaveText('$900.00');
    await expect(page.getByTestId('proposed-liabilities-cad')).toHaveText(
        '$0.00',
    );
    await expect(page.getByTestId('proposed-equity-cad')).toHaveText('$900.00');
    await expect(
        page.getByTestId('balance-figures-differ-warning'),
    ).toHaveCount(0);
    await expect(page.getByTestId('register-period-balance')).toHaveText(
        'Register balance',
    );
    await expect(page.getByTestId('registered-balance-empty')).toBeVisible();
    await expect(page.getByTestId('balance-history-empty')).toBeVisible();

    await page.getByTestId('register-period-balance').click();
    await expect(page.getByTestId('period-balance-success')).toContainText(
        'registered',
    );
    await expect(page.getByTestId('registered-assets-cad')).toHaveText(
        '$900.00',
    );
    await expect(page.getByTestId('overwrite-balance-dialog')).toHaveCount(0);

    const extraSpend = await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            category_id: groceries!.id,
            account_id: bank.id,
            amount_cad: 50,
            comments: 'period-balance-extra',
        },
    });
    expect(extraSpend.ok()).toBeTruthy();

    await page.reload();
    await expect(page.getByTestId('proposed-assets-cad')).toHaveText('$750.00');
    await expect(page.getByTestId('registered-assets-cad')).toHaveText(
        '$900.00',
    );
    await expect(
        page.getByTestId('balance-figures-differ-warning'),
    ).toBeVisible();
    await expect(
        page.getByTestId('balance-figures-differ-warning'),
    ).toContainText(/overwrite/i);
    await expect(page.getByTestId('proposed-assets-cad-delta')).toHaveText(
        '-$150.00',
    );
    await expect(page.getByTestId('proposed-balance-card')).toHaveAttribute(
        'data-differs',
        'true',
    );
    await expect(page.getByTestId('registered-balance-card')).toHaveAttribute(
        'data-differs',
        'true',
    );
    await expect(
        page
            .getByTestId('proposed-assets-cad')
            .locator('xpath=ancestor::div[1]'),
    ).toHaveAttribute('data-differs', 'true');
    await expect(
        page
            .getByTestId('proposed-liabilities-cad')
            .locator('xpath=ancestor::div[1]'),
    ).not.toHaveAttribute('data-differs', 'true');
    await expect(page.getByTestId('register-period-balance')).toHaveText(
        'Overwrite balance',
    );

    await page.getByTestId('register-period-balance').click();
    await expect(page.getByTestId('overwrite-balance-dialog')).toBeVisible();
    await expect(
        page.getByTestId('overwrite-figures-differ-warning'),
    ).toBeVisible();
    await expect(
        page.getByTestId('overwrite-proposed-assets-cad-delta'),
    ).toHaveText('-$150.00');
    await expect(page.getByTestId('overwrite-balance-title')).toHaveText(
        'Overwrite existing balance?',
    );
    await expect(page.getByTestId('overwrite-existing-assets-cad')).toHaveText(
        '$900.00',
    );
    await expect(page.getByTestId('overwrite-proposed-assets-cad')).toHaveText(
        '$750.00',
    );

    await page.getByTestId('overwrite-balance-confirm').click();
    await expect(page.getByTestId('period-balance-success')).toContainText(
        'overwritten',
    );
    await expect(page.getByTestId('registered-assets-cad')).toHaveText(
        '$750.00',
    );
    await expect(page.getByTestId('proposed-assets-cad')).toHaveText('$600.00');
    await expect(
        page.getByTestId('balance-figures-differ-warning'),
    ).toBeVisible();
    await expect(page.getByTestId('proposed-assets-cad-delta')).toHaveText(
        '-$150.00',
    );

    const savedBalances = await request.get(
        `/api/accounts/${bank.id}/balances?period=202501`,
    );
    expect(savedBalances.ok()).toBeTruthy();
    const savedBalance = (await savedBalances.json()).data[0];
    expect(savedBalance.recorded_balance_cad).toBe(750);
    await expect(page.getByTestId('balance-history-table')).toBeVisible();
    await expect(
        page.locator('[data-testid^="balance-history-assets-"]'),
    ).toHaveText('$900.00');

    expect(consoleErrors).toEqual([]);
});
