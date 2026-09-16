import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function seedRecentActivityData(
    request: APIRequestContext,
): Promise<{ expenseId: number; incomeId: number }> {
    const categoryResponse = await request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = categories.data.find((item) => item.code === 'C001');
    expect(category).toBeTruthy();

    const accountResponse = await request.post('/api/accounts', {
        data: {
            name: 'Dashboard Activity Checking',
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

    const incomeResponse = await request.post('/api/income', {
        data: {
            period: '202601',
            description: 'Browser Feed Salary',
            amount_cad: 5100,
            amount_usd: 0,
            amount_cop: 0,
        },
    });
    expect(incomeResponse.ok()).toBeTruthy();
    const income = (await incomeResponse.json()) as { data: { id: number } };

    const txResponse = await request.post('/api/transactions', {
        data: {
            date: '2026-01-21',
            period: '202601',
            quincena: 'Q2',
            category_id: category!.id,
            account_id: account.data.id,
            amount_cad: 67.4,
            comments: 'Browser feed grocery seed',
        },
    });
    expect(txResponse.ok()).toBeTruthy();
    const transaction = (await txResponse.json()) as { data: { id: number } };

    return { expenseId: transaction.data.id, incomeId: income.data.id };
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 111: dashboard shows recent activity feed with clickable details', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const { expenseId, incomeId } = await seedRecentActivityData(request);

    // Step 1: Navigate to dashboard
    await page.goto('/dashboard?period=202601');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Step 2: Verify recent activity widget is displayed
    const card = page.getByTestId('recent-activity-card');
    await expect(card).toBeVisible();
    await expect(card.getByText('Recent Activity', { exact: true })).toBeVisible();

    await page.screenshot({
        path: 'verification/session-61/01-dashboard-with-recent-activity.png',
        fullPage: true,
    });

    // Step 3: Verify last 10-20 transactions/changes are shown
    const list = page.getByTestId('recent-activity-list');
    await expect(list).toBeVisible();
    const items = list.locator('[data-testid^="recent-activity-item-"]');
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThanOrEqual(2);
    expect(itemCount).toBeLessThanOrEqual(20);

    const expenseItem = page.getByTestId(
        `recent-activity-item-expense-${expenseId}`,
    );
    const incomeItem = page.getByTestId(
        `recent-activity-item-income-${incomeId}`,
    );
    await expect(expenseItem).toBeVisible();
    await expect(incomeItem).toBeVisible();

    // Step 4: Verify each item shows date, type, and summary
    await expect(
        page.getByTestId(`recent-activity-type-expense-${expenseId}`),
    ).toContainText('Expense');
    await expect(
        page.getByTestId(`recent-activity-date-expense-${expenseId}`),
    ).toContainText('Jan');
    await expect(
        page.getByTestId(`recent-activity-summary-expense-${expenseId}`),
    ).toContainText('Browser feed grocery seed');
    await expect(
        page.getByTestId(`recent-activity-amount-expense-${expenseId}`),
    ).toContainText('$67.40');

    await expect(
        page.getByTestId(`recent-activity-type-income-${incomeId}`),
    ).toContainText('Income');
    await expect(
        page.getByTestId(`recent-activity-summary-income-${incomeId}`),
    ).toContainText('Browser Feed Salary');

    await card.screenshot({
        path: 'verification/session-61/02-recent-activity-widget.png',
    });

    // Step 5: Verify user can click to view details
    await expenseItem.click();
    await expect(page).toHaveURL(/\/transactions\?/);
    await expect(page).toHaveURL(new RegExp(`period=202601`));
    await expect(page).toHaveURL(new RegExp(`highlight=${expenseId}`));
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Comments')).toHaveValue(
        'Browser feed grocery seed',
    );

    await page.screenshot({
        path: 'verification/session-61/03-transaction-details-from-activity.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
