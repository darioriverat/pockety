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

test('feature 91: user can filter account transaction history by date range', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const account = await createAccount(request, 'RBC Checking Date Filter');
    const categoryId = await getCategoryId(request);

    // Ledger ending balance after all expenses: 1000 - 50 - 100 - 200 - 50 = 600
    const balanceResponse = await request.post(`/api/accounts/${account.id}/balances`, {
        data: {
            period: '202502',
            recorded_balance_cad: 600,
            recorded_balance_usd: 0,
            recorded_balance_cop: 0,
        },
    });
    expect(balanceResponse.ok()).toBeTruthy();

    await request.post('/api/transactions', {
        data: {
            date: '2024-12-15',
            period: '202412',
            quincena: 'Q2',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 50,
            comments: 'dec-expense',
        },
    });
    await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 100,
            comments: 'jan-first',
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
            comments: 'jan-second',
        },
    });
    await request.post('/api/transactions', {
        data: {
            date: '2025-02-10',
            period: '202502',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 50,
            comments: 'feb-expense',
        },
    });

    // Step 1: Navigate to account transaction history
    await page.goto(`/accounts/${account.id}`);
    await expect(page.getByTestId('account-detail-page')).toBeVisible();
    await expect(page.getByTestId('account-date-filter')).toBeVisible();
    await expect(page.getByText('dec-expense')).toBeVisible();
    await expect(page.getByText('feb-expense')).toBeVisible();

    // Step 2: Apply date range filter (Jan 1 2025 to Jan 31 2025)
    await page.getByTestId('filter-start-date').fill('2025-01-01');
    await page.getByTestId('filter-end-date').fill('2025-01-31');
    await page.getByTestId('apply-date-filter').click();

    // Step 3: Verify only transactions in that date range are shown
    await expect(page.getByTestId('active-date-filter')).toContainText(
        '2025-01-01 to 2025-01-31',
    );
    await expect(page.getByText('jan-first')).toBeVisible();
    await expect(page.getByText('jan-second')).toBeVisible();
    await expect(page.getByText('dec-expense')).toHaveCount(0);
    await expect(page.getByText('feb-expense')).toHaveCount(0);

    // Step 4: Verify starting balance for filtered view is correct
    // 1000 - 50 (Dec) = 950 at start of January
    await expect(page.getByTestId('starting-balance')).toContainText('950.00');
    await expect(page.getByTestId('starting-balance-row')).toContainText('950.00');
    await expect(page.getByTestId('current-balance')).toContainText('650.00');
    await expect(page.getByTestId('final-running-balance')).toContainText('650.00');

    const apiResponse = await request.get(
        `/api/accounts/${account.id}/transactions?start_date=2025-01-01&end_date=2025-01-31`,
    );
    expect(apiResponse.ok()).toBeTruthy();
    const apiBody = (await apiResponse.json()) as {
        meta: {
            starting_balance: number;
            current_balance: number;
            total_count: number;
            is_filtered: boolean;
        };
        data: Array<{ comments: string | null; running_balance: number }>;
    };
    expect(apiBody.meta.is_filtered).toBe(true);
    expect(apiBody.meta.total_count).toBe(2);
    expect(apiBody.meta.starting_balance).toBe(950);
    expect(apiBody.meta.current_balance).toBe(650);
    expect(apiBody.data.map((row) => row.comments)).toEqual([
        'jan-second',
        'jan-first',
    ]);

    await page.screenshot({
        path: 'verification/test-91-date-filter/01-filtered-january.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
