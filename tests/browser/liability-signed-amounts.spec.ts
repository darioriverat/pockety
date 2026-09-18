import { expect, test, type APIRequestContext } from '@playwright/test';
import { formatSignedDisplayCurrency } from '../../resources/js/lib/currency';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
} from './helpers';

async function createLiabilityAccount(
    request: APIRequestContext,
    name: string,
): Promise<{ id: number; name: string }> {
    const response = await request.post('/api/accounts', {
        data: {
            name,
            type: 'liability',
            primary_currency: 'CAD',
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { data: { id: number; name: string } };

    return body.data;
}

async function getCategories(
    request: APIRequestContext,
): Promise<{ expenseId: number; debtId: number }> {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { data: ApiCategory[] };

    const expense = body.data.find((item) => !item.is_debt_category && !item.is_income_category);
    const debt = body.data.find((item) => item.is_debt_category);

    expect(expense).toBeTruthy();
    expect(debt).toBeTruthy();

    return { expenseId: expense!.id, debtId: debt!.id };
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('liability account: charges are + red and principal is - green', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const account = await createLiabilityAccount(request, 'CIBC Visa Signed Amounts');
    const { expenseId, debtId } = await getCategories(request);

    const balanceResponse = await request.post(`/api/accounts/${account.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 900,
            recorded_balance_usd: 0,
            recorded_balance_cop: 0,
        },
    });
    expect(balanceResponse.ok()).toBeTruthy();

    const charge = await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: expenseId,
            account_id: account.id,
            amount_cad: 150,
            is_credit: false,
            comments: 'liability-charge',
        },
    });
    expect(charge.ok()).toBeTruthy();
    const chargeId = ((await charge.json()) as { data: { id: number } }).data.id;

    const principal = await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: debtId,
            account_id: account.id,
            amount_cad: 250,
            debt_component: 'principal',
            is_credit: false,
            comments: 'liability-principal',
        },
    });
    expect(principal.ok()).toBeTruthy();
    const principalId = ((await principal.json()) as { data: { id: number } }).data.id;

    await page.goto(`/accounts/${account.id}`);
    await expect(page.getByTestId('account-detail-page')).toBeVisible();
    await expect(page.getByText('liability-charge')).toBeVisible();
    await expect(page.getByText('liability-principal')).toBeVisible();

    const chargeCell = page.getByTestId(`account-tx-amount-${chargeId}`);
    const principalCell = page.getByTestId(`account-tx-amount-${principalId}`);

    await expect(chargeCell).toHaveText(formatSignedDisplayCurrency(150, 'CAD'));
    await expect(chargeCell).toHaveAttribute('data-amount-tone', 'negative');
    await expect(chargeCell).toHaveClass(/text-red/);

    await expect(principalCell).toHaveText(formatSignedDisplayCurrency(-250, 'CAD'));
    await expect(principalCell).toHaveAttribute('data-amount-tone', 'positive');
    await expect(principalCell).toHaveClass(/text-green/);

    expect(consoleErrors).toEqual([]);
});
