import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 65-70: balance sheet shows assets liabilities equity in CAD USD COP', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    await request.post('/api/exchange-rates', {
        data: {
            period: '202501',
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'RBC Checking BS',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()).data;

    const investmentResponse = await request.post('/api/accounts', {
        data: {
            name: 'TD Brokerage BS',
            type: 'investment',
            primary_currency: 'CAD',
        },
    });
    expect(investmentResponse.ok()).toBeTruthy();
    const investment = (await investmentResponse.json()).data;

    const receivableResponse = await request.post('/api/accounts', {
        data: {
            name: 'Loan to Diana BS',
            type: 'receivable',
            primary_currency: 'CAD',
        },
    });
    expect(receivableResponse.ok()).toBeTruthy();
    const receivable = (await receivableResponse.json()).data;

    const loanResponse = await request.post('/api/accounts', {
        data: {
            name: 'Personal LOAN CIBC BS',
            type: 'liability',
            primary_currency: 'CAD',
        },
    });
    expect(loanResponse.ok()).toBeTruthy();
    const loan = (await loanResponse.json()).data;

    await request.post(`/api/accounts/${bank.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 1000,
        },
    });
    await request.post(`/api/accounts/${investment.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 5000,
        },
    });
    await request.post(`/api/accounts/${receivable.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 250,
        },
    });
    await request.post(`/api/accounts/${loan.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 2000,
        },
    });

    // Seed a fixed asset via verification-friendly API path: create through
    // artisan-backed seed is not available here, so use a dedicated helper
    // endpoint if present; otherwise rely on account totals for UI smoke and
    // assert fixed-asset line via JSON when the helper creates one.
    const seedFixed = await request.get(
        '/dev/seed-balance-sheet-fixture?period=202501&book_value=25000',
    );
    expect(seedFixed.ok()).toBeTruthy();

    await page.goto('/balance-sheet');

    await expect(
        page.getByRole('heading', { name: 'Balance Sheet' }),
    ).toBeVisible();
    await expect(page.getByTestId('period-selector')).toBeVisible();
    await expect(page.getByTestId('balance-sheet-summary')).toBeVisible();
    await expect(page.getByTestId('assets-table')).toBeVisible();
    await expect(page.getByTestId('liabilities-table')).toBeVisible();
    await expect(page.getByTestId('multi-currency-totals')).toBeVisible();

    // Accounts 6250 + fixed asset 25000 = 31250 assets; liabilities 2000; equity 29250
    await expect(page.getByTestId('total-assets-cad')).toContainText('31,250');
    await expect(page.getByTestId('total-liabilities-cad')).toContainText(
        '2,000',
    );
    await expect(page.getByTestId('equity-cad')).toContainText('29,250');

    await expect(page.getByTestId('accounts-assets-cad')).toContainText(
        '6,250',
    );
    await expect(page.getByTestId('fixed-assets-cad')).toContainText('25,000');

    // USD equivalents: CAD / 0.75
    await expect(page.getByTestId('total-assets-usd')).toContainText('41,666');
    await expect(page.getByTestId('total-liabilities-usd')).toContainText(
        '2,666',
    );
    await expect(page.getByTestId('equity-usd')).toContainText('39,000');

    // COP equivalents: CAD * 3000
    await expect(page.getByTestId('total-assets-cop')).toContainText(
        '93,750,000',
    );
    await expect(page.getByTestId('total-liabilities-cop')).toContainText(
        '6,000,000',
    );
    await expect(page.getByTestId('equity-cop')).toContainText('87,750,000');

    await expect(page.getByText('RBC Checking BS')).toBeVisible();
    await expect(page.getByText('TD Brokerage BS')).toBeVisible();
    await expect(page.getByText('Loan to Diana BS')).toBeVisible();
    await expect(page.getByText('Ford Escape')).toBeVisible();
    await expect(page.getByText('Personal LOAN CIBC BS')).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
