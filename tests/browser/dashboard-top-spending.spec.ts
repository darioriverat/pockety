import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function seedTopSpendingData(
    request: APIRequestContext,
): Promise<void> {
    const categoryResponse = await request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };

    const findCategory = (code: string) => {
        const category = categories.data.find((item) => item.code === code);
        expect(category).toBeTruthy();
        return category!;
    };

    const accountResponse = await request.post('/api/accounts', {
        data: {
            name: 'Dashboard Top Spending Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const account = (await accountResponse.json()) as { data: { id: number } };

    const rateResponse = await request.post('/api/exchange-rates', {
        data: {
            period: '202601',
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });
    expect(rateResponse.ok()).toBeTruthy();

    const spendRows: Array<{ code: string; amount: number }> = [
        { code: 'C001', amount: 800 },
        { code: 'C006', amount: 500 },
        { code: 'C004', amount: 350 },
        { code: 'C008', amount: 250 },
        { code: 'C005', amount: 100 },
        { code: 'C007', amount: 50 },
        { code: 'C002', amount: 40 },
        { code: 'C003', amount: 30 },
    ];

    for (const row of spendRows) {
        const category = findCategory(row.code);
        const txResponse = await request.post('/api/transactions', {
            data: {
                date: '2026-01-15',
                period: '202601',
                quincena: 'Q1',
                category_id: category.id,
                account_id: account.data.id,
                amount_cad: row.amount,
                comments: `Top spending seed ${row.code}`,
            },
        });
        expect(txResponse.ok()).toBeTruthy();
    }
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 103: dashboard shows top spending categories for current period', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await seedTopSpendingData(request);

    // Step 1: Navigate to dashboard
    await page.goto('/dashboard?period=202601');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Step 2: Verify 'Top Spending Categories' widget is displayed
    const card = page.getByTestId('top-spending-categories-card');
    await expect(card).toBeVisible();
    await expect(page.getByText('Top Spending Categories')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-103-top-spending/01-dashboard-overview.png',
        fullPage: true,
    });

    // Step 3: Verify top 5-10 categories by spending are shown
    const list = page.getByTestId('top-spending-categories-list');
    await expect(list).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C001')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C006')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C004')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C008')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C005')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C007')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C002')).toBeVisible();
    await expect(page.getByTestId('top-spending-row-C003')).toBeVisible();

    // Step 4: Verify amounts are displayed
    await expect(page.getByTestId('top-spending-amount-C001')).toContainText(
        '$800.00',
    );
    await expect(page.getByTestId('top-spending-amount-C006')).toContainText(
        '$500.00',
    );

    // Step 5: Verify percentages or chart visualization is included
    await expect(page.getByTestId('top-spending-pct-C001')).toContainText('%');
    await expect(page.getByTestId('top-spending-bar-C001')).toBeVisible();
    await expect(page.getByTestId('top-spending-bar-C006')).toBeVisible();

    const rows = list.locator('[data-testid^="top-spending-row-"]');
    await expect(rows).toHaveCount(8);

    await card.screenshot({
        path: 'verification/test-103-top-spending/02-widget-closeup.png',
    });

    await page.screenshot({
        path: 'verification/test-103-top-spending/03-full-page.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
