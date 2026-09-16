import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function seedYtdData(request: APIRequestContext): Promise<void> {
    const categoryResponse = await request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const groceries = categories.data.find((item) => item.code === 'C001');
    expect(groceries).toBeTruthy();

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'YTD Test Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()) as { data: { id: number } };

    // Create data for 3 months of 2025
    for (let month = 1; month <= 3; month++) {
        const period = `20250${month}`;

        // Create exchange rate
        const rateResponse = await request.post('/api/exchange-rates', {
            data: {
                period,
                usd_cop: 4400,
                usd_cad: 0.75,
                cad_cop: 3000,
            },
        });
        expect(rateResponse.ok()).toBeTruthy();

        // Create income
        const incomeResponse = await request.post('/api/income', {
            data: {
                period,
                description: `Salary Month ${month}`,
                line_number: 1,
                amount_cad: 5000,
            },
        });
        expect(incomeResponse.ok()).toBeTruthy();

        // Create expense transaction
        const txResponse = await request.post('/api/transactions', {
            data: {
                date: `2025-0${month}-15`,
                period,
                quincena: 'Q1',
                category_id: groceries!.id,
                account_id: bank.data.id,
                amount_cad: 1000 + (month * 100),
                comments: `YTD Test Month ${month}`,
            },
        });
        expect(txResponse.ok()).toBeTruthy();
    }
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 105: user can view year-to-date totals for income and expenses', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await seedYtdData(request);

    // Step 1: Navigate to reports page
    await page.goto('/reports/year-to-date');

    await expect(page.getByTestId('reports-ytd-heading')).toBeVisible();
    await expect(page.getByTestId('reports-ytd-heading')).toHaveText(
        'Year-to-Date Reports',
    );

    await page.screenshot({
        path: 'verification/test-105-ytd-reports/01-page-loaded.png',
        fullPage: true,
    });

    // Step 2: Select year 2025
    await expect(page.getByTestId('year-select')).toBeVisible();
    await page.getByTestId('year-select').click();
    await page.getByTestId('year-option-2025').click();

    await page.screenshot({
        path: 'verification/test-105-ytd-reports/02-year-selected.png',
        fullPage: true,
    });

    // Wait for data to load
    await page.waitForTimeout(500);

    // Step 3: Verify YTD income total is displayed
    await expect(page.getByTestId('ytd-income-card')).toBeVisible();
    await expect(page.getByTestId('ytd-income-total')).toBeVisible();
    await expect(page.getByTestId('ytd-income-total')).toContainText('$15,000.00');

    await page.getByTestId('ytd-income-card').screenshot({
        path: 'verification/test-105-ytd-reports/03-income-card.png',
    });

    // Step 4: Verify YTD expense total is displayed
    await expect(page.getByTestId('ytd-expenses-card')).toBeVisible();
    await expect(page.getByTestId('ytd-expenses-total')).toBeVisible();
    await expect(page.getByTestId('ytd-expenses-total')).toContainText('$3,600.00');

    await page.getByTestId('ytd-expenses-card').screenshot({
        path: 'verification/test-105-ytd-reports/04-expenses-card.png',
    });

    // Step 5: Verify YTD net (income - expenses) is displayed
    await expect(page.getByTestId('ytd-net-card')).toBeVisible();
    await expect(page.getByTestId('ytd-net-total')).toBeVisible();
    await expect(page.getByTestId('ytd-net-total')).toContainText('$11,400.00');

    await page.getByTestId('ytd-net-card').screenshot({
        path: 'verification/test-105-ytd-reports/05-net-card.png',
    });

    // Step 6: Verify totals update when year selection changes
    // Select a different year (2024)
    await page.getByTestId('year-select').click();
    await page.getByTestId('year-option-2024').click();

    // Wait for data to load
    await page.waitForTimeout(500);

    // Verify the year has changed in the summary
    await expect(page.getByTestId('ytd-summary-card')).toContainText('Year-to-Date Summary for 2024');

    await page.screenshot({
        path: 'verification/test-105-ytd-reports/06-year-changed.png',
        fullPage: true,
    });

    // Full page screenshot
    await page.getByTestId('year-select').click();
    await page.getByTestId('year-option-2025').click();
    await page.waitForTimeout(500);

    await page.screenshot({
        path: 'verification/test-105-ytd-reports/07-full-page.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
