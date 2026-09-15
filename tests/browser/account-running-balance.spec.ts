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
    const body = (await response.json()) as { data: { id: number; name: string } };
    return body.data;
}

async function getCategoryId(request: APIRequestContext): Promise<number> {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = body.data.find((item) => item.code === 'C001') ?? body.data[0];
    expect(category).toBeTruthy();
    return category.id;
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 90: account transaction history shows running balance after each transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const account = await createAccount(request, 'RBC Checking Running Balance');
    const categoryId = await getCategoryId(request);

    // Recorded current balance after the two expenses below
    const balanceResponse = await request.post(`/api/accounts/${account.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 700,
            recorded_balance_usd: 0,
            recorded_balance_cop: 0,
        },
    });
    expect(balanceResponse.ok()).toBeTruthy();

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 100,
            comments: 'rb-first',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 200,
            comments: 'rb-second',
        },
    });

    // Step 1–2: Navigate to account details / transaction history
    await page.goto(`/accounts/${account.id}`);
    await expect(page.getByTestId('account-detail-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: account.name })).toBeVisible();

    // Step 3: Starting balance is shown
    await expect(page.getByTestId('starting-balance')).toContainText('1,000.00');
    await expect(page.getByTestId('starting-balance-row')).toContainText('Starting balance');
    await expect(page.getByTestId('starting-balance-row')).toContainText('1,000.00');

    // Step 4: Each transaction shows balance after that transaction
    await expect(page.getByTestId('account-transactions-table')).toBeVisible();
    await expect(page.getByText('rb-second')).toBeVisible();
    await expect(page.getByText('rb-first')).toBeVisible();
    await expect(page.getByTestId('final-running-balance')).toContainText('700.00');

    // Step 5: Final / current balance matches
    await expect(page.getByTestId('current-balance')).toContainText('700.00');

    const apiResponse = await request.get(`/api/accounts/${account.id}/transactions`);
    expect(apiResponse.ok()).toBeTruthy();
    const apiBody = (await apiResponse.json()) as {
        meta: { starting_balance: number; current_balance: number };
        data: Array<{ running_balance: number; comments: string | null }>;
    };
    expect(apiBody.meta.starting_balance).toBe(1000);
    expect(apiBody.meta.current_balance).toBe(700);
    expect(apiBody.data[0].running_balance).toBe(700);
    expect(apiBody.data[0].comments).toBe('rb-second');
    expect(apiBody.data[1].running_balance).toBe(900);

    await page.screenshot({
        path: 'verification/test-90-running-balance/account-running-balance.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
