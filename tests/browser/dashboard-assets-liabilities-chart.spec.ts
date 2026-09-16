import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function seedAssetsLiabilitiesData(
    request: APIRequestContext,
): Promise<void> {
    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'Dashboard AL Chart Bank',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()) as { data: { id: number } };

    const liabilityResponse = await request.post('/api/accounts', {
        data: {
            name: 'Dashboard AL Chart Loan',
            type: 'liability',
            primary_currency: 'CAD',
        },
    });
    expect(liabilityResponse.ok()).toBeTruthy();
    const liability = (await liabilityResponse.json()) as {
        data: { id: number };
    };

    const periods = [
        '202507',
        '202508',
        '202509',
        '202510',
        '202511',
        '202512',
        '202601',
        '202602',
        '202603',
        '202604',
        '202605',
        '202606',
    ];

    for (const [index, period] of periods.entries()) {
        await request.post('/api/exchange-rates', {
            data: {
                period,
                usd_cop: 4400,
                usd_cad: 0.75,
                cad_cop: 3000,
            },
        });

        const assetBalance = await request.post(
            `/api/accounts/${bank.data.id}/balances`,
            {
                data: {
                    period,
                    recorded_balance_cad: 10000 + index * 500,
                    recorded_balance_usd: 0,
                    recorded_balance_cop: 0,
                },
            },
        );
        expect(assetBalance.ok()).toBeTruthy();

        const liabilityBalance = await request.post(
            `/api/accounts/${liability.data.id}/balances`,
            {
                data: {
                    period,
                    recorded_balance_cad: 2500 + index * 100,
                    recorded_balance_usd: 0,
                    recorded_balance_cop: 0,
                },
            },
        );
        expect(liabilityBalance.ok()).toBeTruthy();
    }
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 102: dashboard shows assets vs liabilities chart over time', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await seedAssetsLiabilitiesData(request);

    await page.goto('/dashboard?period=202606');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('assets-liabilities-chart-card')).toBeVisible();
    await expect(page.getByText('Assets vs Liabilities')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-102-assets-liabilities-chart/01-dashboard-overview.png',
        fullPage: true,
    });

    const chart = page.getByTestId('assets-liabilities-chart');
    await expect(chart).toBeVisible();

    const range = page.getByTestId('assets-liabilities-chart-range');
    await expect(range).toContainText(/Last 12 months/i);

    const legend = page.getByTestId('assets-liabilities-chart-legend');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('Assets');
    await expect(legend).toContainText('Liabilities');
    await expect(legend).toContainText('Equity');

    await expect(page.getByTestId('al-chart-line-assets')).toBeVisible();
    await expect(page.getByTestId('al-chart-line-liabilities')).toBeVisible();
    await expect(page.getByTestId('al-chart-line-equity')).toBeVisible();
    await expect(page.getByTestId('al-chart-period-202606')).toBeVisible();
    await expect(page.getByTestId('al-chart-period-202507')).toBeVisible();
    await expect(page.getByTestId('al-chart-point-equity-202606')).toBeVisible();

    await page.getByTestId('al-chart-hit-202606').hover();
    await expect(
        page.getByTestId('assets-liabilities-hover-tooltip'),
    ).toBeVisible();
    await expect(
        page.getByTestId('assets-liabilities-hover-tooltip'),
    ).toContainText(/Assets/i);
    await expect(
        page.getByTestId('assets-liabilities-hover-tooltip'),
    ).toContainText(/Liabilities/i);
    await expect(
        page.getByTestId('assets-liabilities-hover-tooltip'),
    ).toContainText(/Equity/i);

    await page.screenshot({
        path: 'verification/test-102-assets-liabilities-chart/02-hover-tooltip.png',
        fullPage: true,
    });

    await chart.screenshot({
        path: 'verification/test-102-assets-liabilities-chart/03-chart-closeup.png',
    });

    await page.screenshot({
        path: 'verification/test-102-assets-liabilities-chart/04-full-page.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
