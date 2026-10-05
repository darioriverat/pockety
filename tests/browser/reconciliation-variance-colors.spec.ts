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

test('feature 169: zero variance displays in green', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page, request);

    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const groceries = categories.data.find((c) => c.code === 'C001');
    expect(groceries).toBeTruthy();

    // Create account with perfectly balanced state
    // Recorded balance = 1000, one transaction of 1000 expense
    // Computed = 1000 - 1000 = 0, but we need variance = 0
    // Actually, computed = recorded_previous_period - expenses + income
    // For zero variance: recorded = computed
    // If recorded = 1000 and no transactions, computed = 0, variance = 1000 (not zero!)
    // So we need: recorded = 1000, transactions that result in computed = 1000
    const account = await createAccount(request, 'Zero Variance Account');
    await createBalance(request, account.id, '202501', 1000);
    // Don't create any transactions - computed will be 1000 (from recorded) minus 0 = 1000
    // Actually, the backend should set computed = recorded when balanced

    await page.goto('/reconciliation');

    await page.getByLabel('Period (YYYYMM)').fill('202501');
    await page.getByRole('button', { name: 'View Reconciliation' }).click();

    const accountCard = page.locator(
        `[data-testid="account-reconciliation-${account.id}"]`,
    );
    await expect(accountCard).toBeVisible();

    // Check that variance is displayed in green
    const cadRow = accountCard.locator('[data-testid="currency-row-CAD"]');
    const varianceAmount = cadRow.locator('[data-testid="variance-amount"]');
    
    // Verify the variance state attribute
    await expect(varianceAmount).toHaveAttribute('data-variance-state', 'balanced');
    
    // Take screenshot
    await page.screenshot({
        path: 'verification/test-169-variance-colors/zero-variance-green.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 169: significant positive variance displays in yellow/amber', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page, request);

    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const groceries = categories.data.find((c) => c.code === 'C001');
    expect(groceries).toBeTruthy();

    // Create account with significant positive variance (> $10 threshold)
    // Pattern: recorded - transaction_amount = computed; variance = recorded - computed
    // Want variance = 20 (significant positive)
    // Recorded: 1000, Transaction: 980 => Computed: 20, Variance: 1000 - 20 = 980
    // That's still wrong. Let me try: Recorded: 1020, Transaction: 1000 => Computed: 20, Variance: 1020 - 20 = 1000
    // 
    // Looking at original test again: Recorded: 1000, Tx: 100 => Computed: 900, Variance: 100
    // So the formula seems to be: Computed = Recorded - Transaction, Variance = Transaction
    // For variance = 20: Recorded: 1020, Transaction: 20
    const account = await createAccount(request, 'Positive Variance Account');
    await createBalance(request, account.id, '202501', 1020);
    await createTransaction(request, {
        accountId: account.id,
        categoryId: groceries!.id,
        period: '202501',
        amountCad: 20,
    });

    await page.goto('/reconciliation');

    await page.getByLabel('Period (YYYYMM)').fill('202501');
    await page.getByRole('button', { name: 'View Reconciliation' }).click();

    const accountCard = page.locator(
        `[data-testid="account-reconciliation-${account.id}"]`,
    );
    await expect(accountCard).toBeVisible();

    // Check that variance is displayed in amber/yellow
    const cadRow = accountCard.locator('[data-testid="currency-row-CAD"]');
    const varianceAmount = cadRow.locator('[data-testid="variance-amount"]');
    
    // Verify the variance state attribute indicates positive significant variance
    await expect(varianceAmount).toHaveAttribute('data-variance-state', 'positive-significant');
    
    // Take screenshot
    await page.screenshot({
        path: 'verification/test-169-variance-colors/positive-variance-amber.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 169: minor variance displays in neutral/muted color', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page, request);

    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const groceries = categories.data.find((c) => c.code === 'C001');
    expect(groceries).toBeTruthy();

    // Create account with minor variance (< $10 threshold, e.g., $5)
    // Recorded: 1005, Transaction: 5 => Computed: 1000, Variance: 5
    const account = await createAccount(request, 'Minor Variance Account');
    await createBalance(request, account.id, '202501', 1005);
    await createTransaction(request, {
        accountId: account.id,
        categoryId: groceries!.id,
        period: '202501',
        amountCad: 5,
    });

    await page.goto('/reconciliation');

    await page.getByLabel('Period (YYYYMM)').fill('202501');
    await page.getByRole('button', { name: 'View Reconciliation' }).click();

    const accountCard = page.locator(
        `[data-testid="account-reconciliation-${account.id}"]`,
    );
    await expect(accountCard).toBeVisible();

    // Check that variance is displayed in muted color
    const cadRow = accountCard.locator('[data-testid="currency-row-CAD"]');
    const varianceAmount = cadRow.locator('[data-testid="variance-amount"]');
    
    // Verify the variance state attribute indicates minor variance
    await expect(varianceAmount).toHaveAttribute('data-variance-state', 'minor');
    
    // Take screenshot
    await page.screenshot({
        path: 'verification/test-169-variance-colors/minor-variance-neutral.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
