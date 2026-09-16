import { expect, test, type APIRequestContext } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
    formatSignedDisplayCurrency,
} from '../../resources/js/lib/currency';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const evidence = 'verification/test-149-signed-amounts';

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

test('feature 149: positive and negative amounts are visually distinguished', async ({
    page,
    request,
}) => {
    mkdirSync(evidence, { recursive: true });
    const consoleErrors = trackConsoleErrors(page);
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const account = await createAccount(request, 'RBC Checking Signed Amounts');
    const categoryId = await getCategoryId(request);

    // Ending balance after -$200 withdrawal + $75 deposit = $875 from $1000 start
    const balanceResponse = await request.post(`/api/accounts/${account.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 875,
            recorded_balance_usd: 0,
            recorded_balance_cop: 0,
        },
    });
    expect(balanceResponse.ok()).toBeTruthy();

    const withdrawal = await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 200,
            is_credit: false,
            comments: 'signed-withdrawal',
        },
    });
    expect(withdrawal.ok()).toBeTruthy();
    const withdrawalId = ((await withdrawal.json()) as { data: { id: number } })
        .data.id;

    const deposit = await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 75,
            is_credit: true,
            comments: 'signed-deposit',
        },
    });
    expect(deposit.ok()).toBeTruthy();
    const depositId = ((await deposit.json()) as { data: { id: number } }).data
        .id;

    // Step 1: Navigate to account transaction history with deposits + withdrawals
    await page.goto(`/accounts/${account.id}`);
    await expect(page.getByTestId('account-detail-page')).toBeVisible();
    await expect(page.getByTestId('account-transactions-table')).toBeVisible();
    await expect(page.getByText('signed-deposit')).toBeVisible();
    await expect(page.getByText('signed-withdrawal')).toBeVisible();

    const depositCell = page.getByTestId(`account-tx-amount-${depositId}`);
    const withdrawalCell = page.getByTestId(
        `account-tx-amount-${withdrawalId}`,
    );

    await expect(depositCell).toBeVisible();
    await expect(withdrawalCell).toBeVisible();

    const expectedDeposit = formatSignedDisplayCurrency(75, 'CAD');
    const expectedWithdrawal = formatSignedDisplayCurrency(-200, 'CAD');

    // Step 3–5: positive green with +, negative red with -
    await expect(depositCell).toHaveText(expectedDeposit);
    await expect(depositCell).toHaveAttribute('data-amount-tone', 'positive');
    await expect(depositCell).toHaveClass(/text-green/);
    expect(expectedDeposit.startsWith('+')).toBe(true);

    await expect(withdrawalCell).toHaveText(expectedWithdrawal);
    await expect(withdrawalCell).toHaveAttribute('data-amount-tone', 'negative');
    await expect(withdrawalCell).toHaveClass(/text-red/);
    expect(expectedWithdrawal.startsWith('-')).toBe(true);

    const depositColor = await depositCell.evaluate(
        (el) => getComputedStyle(el).color,
    );
    const withdrawalColor = await withdrawalCell.evaluate(
        (el) => getComputedStyle(el).color,
    );
    expect(depositColor).not.toBe(withdrawalColor);

    // Step 2: Screenshots
    await page.screenshot({
        path: `${evidence}/account-signed-amounts.png`,
        fullPage: true,
    });
    await depositCell.screenshot({ path: `${evidence}/deposit-positive.png` });
    await withdrawalCell.screenshot({
        path: `${evidence}/withdrawal-negative.png`,
    });

    expect(consoleErrors).toEqual([]);
});
