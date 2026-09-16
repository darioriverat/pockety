import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const evidence = 'verification/test-157-responsive-charts';

async function seedChartData(page: import('@playwright/test').Page) {
    const categoryResponse = await page.request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = categories.data.find((item) => item.code === 'C001');
    expect(category).toBeTruthy();

    const accountResponse = await page.request.post('/api/accounts', {
        data: {
            name: 'Responsive Chart Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const account = (await accountResponse.json()) as { data: { id: number } };

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
        const year = period.slice(0, 4);
        const month = period.slice(4, 6);

        await page.request.post('/api/exchange-rates', {
            data: {
                period,
                usd_cop: 4400,
                usd_cad: 0.75,
                cad_cop: 3000,
            },
        });

        const incomeResponse = await page.request.post('/api/income', {
            data: {
                period,
                description: `Salary ${period}`,
                amount_cad: 4000 + index * 100,
                amount_usd: 0,
                amount_cop: 0,
            },
        });
        expect(incomeResponse.ok()).toBeTruthy();

        const txResponse = await page.request.post('/api/transactions', {
            data: {
                date: `${year}-${month}-10`,
                period,
                quincena: 'Q1',
                category_id: category!.id,
                account_id: account.data.id,
                amount_cad: 1500 + index * 50,
                comments: `Responsive chart expense ${period}`,
            },
        });
        expect(txResponse.ok()).toBeTruthy();
    }
}

function boxesOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
    pad = 1,
): boolean {
    return !(
        a.x + a.width + pad <= b.x ||
        b.x + b.width + pad <= a.x ||
        a.y + a.height + pad <= b.y ||
        b.y + b.height + pad <= a.y
    );
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

for (const theme of ['light', 'dark'] as const) {
    test(`dashboard charts are readable and interactive on mobile in ${theme}`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 375, height: 812 });
        await seedChartData(page);

        await page.goto('/dashboard?period=202606');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

        const incomeWrap = page.getByTestId('income-expense-chart-responsive');
        const incomeChart = page.getByTestId('income-expense-chart');
        await expect(incomeWrap).toHaveAttribute('data-responsive', 'mobile');
        await expect(incomeChart).toBeVisible();

        const incomeBox = await incomeChart.boundingBox();
        expect(incomeBox).toBeTruthy();
        expect(incomeBox!.width).toBeGreaterThan(280);
        expect(incomeBox!.width).toBeLessThanOrEqual(375);
        expect(incomeBox!.height).toBeGreaterThan(140);

        const incomeTicks = page.getByTestId('income-expense-chart-x-tick');
        const tickCount = await incomeTicks.count();
        expect(tickCount).toBeGreaterThanOrEqual(2);
        expect(tickCount).toBeLessThanOrEqual(5);

        const tickBoxes = [];
        for (let i = 0; i < tickCount; i++) {
            const box = await incomeTicks.nth(i).boundingBox();
            expect(box).toBeTruthy();
            expect(box!.height).toBeGreaterThanOrEqual(9);
            tickBoxes.push(box!);
        }
        for (let i = 0; i < tickBoxes.length; i++) {
            for (let j = i + 1; j < tickBoxes.length; j++) {
                expect(
                    boxesOverlap(tickBoxes[i], tickBoxes[j]),
                    `income x-tick ${i} overlaps ${j}`,
                ).toBeFalsy();
            }
        }

        await expect(
            page.getByTestId('income-expense-chart-y-axis-label'),
        ).toBeVisible();
        await expect(
            page.getByTestId('income-expense-chart-x-axis-label'),
        ).toBeVisible();

        await page.screenshot({
            path: `${evidence}/${theme}-mobile-dashboard.png`,
            fullPage: true,
        });
        await incomeChart.screenshot({
            path: `${evidence}/${theme}-mobile-income-expense-chart.png`,
        });

        const assetsWrap = page.getByTestId('assets-liabilities-chart-wrap');
        const assetsChart = page.getByTestId('assets-liabilities-chart');
        await expect(assetsWrap).toHaveAttribute('data-responsive', 'mobile');
        await expect(assetsChart).toBeVisible();

        const assetsBox = await assetsChart.boundingBox();
        expect(assetsBox).toBeTruthy();
        expect(assetsBox!.width).toBeGreaterThan(280);
        expect(assetsBox!.width).toBeLessThanOrEqual(375);

        const assetsTicks = page.getByTestId('assets-liabilities-chart-x-tick');
        const assetsTickCount = await assetsTicks.count();
        expect(assetsTickCount).toBeGreaterThanOrEqual(2);
        expect(assetsTickCount).toBeLessThanOrEqual(5);

        const assetsTickBoxes = [];
        for (let i = 0; i < assetsTickCount; i++) {
            const box = await assetsTicks.nth(i).boundingBox();
            expect(box).toBeTruthy();
            expect(box!.height).toBeGreaterThanOrEqual(9);
            assetsTickBoxes.push(box!);
        }
        for (let i = 0; i < assetsTickBoxes.length; i++) {
            for (let j = i + 1; j < assetsTickBoxes.length; j++) {
                expect(
                    boxesOverlap(assetsTickBoxes[i], assetsTickBoxes[j]),
                    `assets x-tick ${i} overlaps ${j}`,
                ).toBeFalsy();
            }
        }

        await assetsChart.screenshot({
            path: `${evidence}/${theme}-mobile-assets-liabilities-chart.png`,
        });

        // Touch/pointer interaction still shows period values
        await page.getByTestId('al-chart-hit-202606').dispatchEvent('pointerdown');
        const tooltip = page.getByTestId('assets-liabilities-hover-tooltip');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Jun');
        await expect(tooltip).toContainText('Assets');
        await expect(tooltip).toContainText('Liabilities');
        await expect(tooltip).toContainText('Equity');

        await page.screenshot({
            path: `${evidence}/${theme}-mobile-assets-tooltip.png`,
            fullPage: false,
        });

        expect(consoleErrors).toEqual([]);
    });
}

test('dashboard charts use desktop layout at wide viewport', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedChartData(page);

    await page.goto('/dashboard?period=202606');
    await expect(
        page.getByTestId('income-expense-chart-responsive'),
    ).toHaveAttribute('data-responsive', 'desktop');
    await expect(
        page.getByTestId('assets-liabilities-chart-wrap'),
    ).toHaveAttribute('data-responsive', 'desktop');

    await page.screenshot({
        path: `${evidence}/desktop-dashboard-charts.png`,
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});
