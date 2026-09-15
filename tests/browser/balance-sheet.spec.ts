import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeEach(() => {
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

test('feature 71: balance sheet time series shows historical trend across periods', async ({
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
    await request.post('/api/exchange-rates', {
        data: {
            period: '202502',
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });
    await request.post('/api/exchange-rates', {
        data: {
            period: '202609',
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'RBC Checking TS',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()).data;

    const loanResponse = await request.post('/api/accounts', {
        data: {
            name: 'Personal LOAN CIBC TS',
            type: 'liability',
            primary_currency: 'CAD',
        },
    });
    expect(loanResponse.ok()).toBeTruthy();
    const loan = (await loanResponse.json()).data;

    await request.post(`/api/accounts/${bank.id}/balances`, {
        data: { period: '202501', recorded_balance_cad: 10000 },
    });
    await request.post(`/api/accounts/${loan.id}/balances`, {
        data: { period: '202501', recorded_balance_cad: 4000 },
    });
    await request.post(`/api/accounts/${bank.id}/balances`, {
        data: { period: '202502', recorded_balance_cad: 12000 },
    });
    await request.post(`/api/accounts/${loan.id}/balances`, {
        data: { period: '202502', recorded_balance_cad: 3500 },
    });
    await request.post(`/api/accounts/${bank.id}/balances`, {
        data: { period: '202609', recorded_balance_cad: 15000 },
    });
    await request.post(`/api/accounts/${loan.id}/balances`, {
        data: { period: '202609', recorded_balance_cad: 2000 },
    });

    await page.goto('/balance-sheet/time-series');

    await expect(
        page.getByRole('heading', { name: 'Balance Sheet Time Series' }),
    ).toBeVisible();
    await expect(page.getByTestId('time-series-summary')).toBeVisible();
    await expect(page.getByTestId('period-count')).toHaveText('21');
    await expect(page.getByTestId('time-series-chart')).toBeVisible();
    await expect(page.getByTestId('time-series-table')).toBeVisible();

    await expect(page.getByTestId('time-series-row-202501')).toBeVisible();
    await expect(page.getByTestId('assets-202501')).toContainText('10,000');
    await expect(page.getByTestId('liabilities-202501')).toContainText('4,000');
    await expect(page.getByTestId('equity-202501')).toContainText('6,000');

    await expect(page.getByTestId('time-series-row-202502')).toBeVisible();
    await expect(page.getByTestId('assets-202502')).toContainText('12,000');
    await expect(page.getByTestId('liabilities-202502')).toContainText('3,500');
    await expect(page.getByTestId('equity-202502')).toContainText('8,500');

    await expect(page.getByTestId('time-series-row-202609')).toBeVisible();
    await expect(page.getByTestId('assets-202609')).toContainText('15,000');
    await expect(page.getByTestId('liabilities-202609')).toContainText('2,000');
    await expect(page.getByTestId('equity-202609')).toContainText('13,000');

    // Equity change: 13000 - 6000 = 7000
    await expect(page.getByTestId('equity-change')).toContainText('7,000');

    await page.screenshot({
        path: 'verification/session-27/time-series-full.png',
        fullPage: true,
    });
    await page.getByTestId('time-series-chart').screenshot({
        path: 'verification/session-27/time-series-chart.png',
    });

    await page.goto('/balance-sheet');
    await page.getByTestId('time-series-link').click();
    await expect(page).toHaveURL(/\/balance-sheet\/time-series/);
    await expect(
        page.getByRole('heading', { name: 'Balance Sheet Time Series' }),
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
});

test('feature 72: import historical balance sheet from estado_financiero', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('estado_financiero_2025_2026.json');
        await dialog.accept();
    });

    await page.goto('/import');
    await expect(
        page.getByRole('heading', { name: 'Import Historical Data' }),
    ).toBeVisible();
    await expect(page.getByTestId('balance-sheet-import-card')).toBeVisible();
    await expect(
        page.getByTestId('balance-sheet-import-card').locator('[data-slot="card-title"]'),
    ).toHaveText('Import Balance Sheet History');

    await expect(page.getByTestId('balance-sheet-file-select')).toHaveValue(
        'estado_financiero_2025_2026.json',
    );

    await page.getByTestId('import-balance-sheet-button').click();

    await expect(page.getByTestId('balance-sheet-import-result')).toBeVisible({
        timeout: 15000,
    });
    await expect(
        page.getByTestId('balance-sheet-periods-imported'),
    ).toContainText('19');
    await expect(page.getByTestId('balance-sheet-total-periods')).toHaveText(
        '19',
    );

    await expect(page.getByTestId('balance-sheet-import-table')).toBeVisible();
    await expect(page.getByTestId('balance-sheet-row-202501')).toBeVisible();
    await expect(page.getByTestId('assets-202501')).toContainText('24,595.73');
    await expect(page.getByTestId('liabilities-202501')).toContainText(
        '35,730.77',
    );
    await expect(page.getByTestId('equity-202501')).toContainText(
        '-$11,135.05',
    );

    await expect(page.getByTestId('balance-sheet-row-202607')).toBeVisible();
    await expect(page.getByTestId('assets-202607')).toContainText('20,542.03');
    await expect(page.getByTestId('liabilities-202607')).toContainText(
        '36,807.86',
    );
    await expect(page.getByTestId('equity-202607')).toContainText(
        '-$16,265.83',
    );

    await page.screenshot({
        path: 'verification/session-28/balance-sheet-import-full.png',
        fullPage: true,
    });
    await page.getByTestId('balance-sheet-import-card').screenshot({
        path: 'verification/session-28/balance-sheet-import-card.png',
    });

    expect(consoleErrors).toEqual([]);
});
