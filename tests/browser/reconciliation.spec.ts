import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function createAccount(
    request: APIRequestContext,
    name: string,
): Promise<{ id: number; name: string }> {
    const response = await request.post('/api/accounts', {
        data: {
            name,
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(response.ok()).toBeTruthy();

    const payload = (await response.json()) as {
        data: { id: number; name: string };
    };

    return payload.data;
}

async function createBalance(
    request: APIRequestContext,
    accountId: number,
    period: string,
    cad: number,
): Promise<void> {
    const response = await request.post(`/api/accounts/${accountId}/balances`, {
        data: {
            period,
            recorded_balance_cad: cad,
            recorded_balance_usd: 0,
            recorded_balance_cop: 0,
        },
    });
    expect(response.ok()).toBeTruthy();
}

async function createTransaction(
    request: APIRequestContext,
    data: {
        accountId: number;
        categoryId: number;
        period: string;
        amountCad: number;
    },
): Promise<void> {
    const response = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: data.period,
            quincena: 'Q1',
            category_id: data.categoryId,
            account_id: data.accountId,
            amount_cad: data.amountCad,
            amount_usd: null,
            amount_cop: null,
        },
    });
    expect(response.ok()).toBeTruthy();
}

test.beforeAll(() => {
    resetBrowserState();
});

test('reconciliation: computed balance reflects linked transactions', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const groceries = categories.data.find((c) => c.code === 'C001');
    expect(groceries).toBeTruthy();

    const account = await createAccount(request, 'Test Bank');
    await createBalance(request, account.id, '202501', 1000);
    await createTransaction(request, {
        accountId: account.id,
        categoryId: groceries!.id,
        period: '202501',
        amountCad: 100,
    });

    await loginAsBrowserTestUser(page);
    await page.goto('/reconciliation');

    await expect(page.getByRole('heading', { name: 'Reconciliation' })).toBeVisible();
    await page.getByLabel('Period (YYYYMM)').fill('202501');
    await page.getByRole('button', { name: 'View Reconciliation' }).click();

    const accountCard = page.locator(
        `[data-testid="account-reconciliation-${account.id}"]`,
    );
    await expect(accountCard).toBeVisible();
    await expect(accountCard.getByText('Test Bank')).toBeVisible();

    const cadRow = accountCard.locator('[data-testid="currency-row-CAD"]');
    await expect(cadRow.locator('[data-testid="recorded-amount"]')).toContainText(
        '1,000',
    );
    await expect(cadRow.locator('[data-testid="computed-amount"]')).toContainText(
        '900',
    );
    await expect(cadRow.locator('[data-testid="variance-amount"]')).toContainText(
        '100',
    );

    const equationCard = page.getByTestId('accounting-equation-card');
    await expect(equationCard).toBeVisible();
    await expect(equationCard).toContainText('calculated operations');
    await expect(equationCard.getByText('Recorded')).toBeVisible();
    await expect(equationCard.getByText('Computed')).toBeVisible();
    await expect(equationCard.getByText('Variance')).toBeVisible();
    await expect(page.getByTestId('assets-recorded')).toBeVisible();
    await expect(page.getByTestId('assets-total')).toBeVisible();
    await expect(page.getByTestId('assets-variance')).toBeVisible();
    await expect(page.getByTestId('equation-currency-USD')).toHaveCount(0);
    await expect(page.getByTestId('equation-currency-COP')).toHaveCount(0);

    const changesCard = page.getByTestId('balance-changes-card');
    await changesCard.scrollIntoViewIfNeeded();
    await expect(changesCard).toBeVisible();
    await expect(changesCard).toContainText('CAD equivalent');
    await expect(page.getByTestId('balance-changes-heading')).toContainText(
        'Balance Changes',
    );
    await expect(
        page.getByTestId(`balance-changes-row-${account.id}`),
    ).toContainText('Test Bank');
    await expect(
        page.getByTestId(`balance-changes-row-${account.id}-initial`),
    ).toContainText('1,000');
    await expect(
        page.getByTestId(`balance-changes-row-${account.id}-computed`),
    ).toContainText('900');
    await expect(
        page.getByTestId(`balance-changes-row-${account.id}-difference`),
    ).toHaveText('$100.00');
    await expect(
        page.getByTestId('balance-changes-assets-total-difference'),
    ).toHaveText('$100.00');
    await expect(
        page.getByTestId('balance-changes-liabilities-total-difference'),
    ).toContainText('0.00');

    const recordsCard = page.getByTestId('records-check-card');
    await recordsCard.scrollIntoViewIfNeeded();
    await expect(recordsCard).toBeVisible();
    await expect(page.getByTestId('records-check-heading')).toContainText(
        'Records Check',
    );
    await expect(page.getByTestId('records-check-formula')).toHaveCount(0);
    await expect(page.getByTestId('records-check-income')).toBeVisible();
    await expect(
        page.getByTestId('records-check-net-operating-expenses'),
    ).toBeVisible();
    await expect(page.getByTestId('records-check-down-payments')).toBeVisible();
    await expect(page.getByTestId('records-check-interest')).toBeVisible();
    await expect(page.getByTestId('records-check-result')).toHaveText('$0.00');
    await expect(page.getByTestId('records-check-status')).toContainText(
        'Closes',
    );

    expect(consoleErrors).toEqual([]);
});
