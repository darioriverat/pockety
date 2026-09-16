import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function seedComparisonData(request: APIRequestContext): Promise<void> {
    const categoryResponse = await request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const groceries = categories.data.find((item) => item.code === 'C001');
    expect(groceries).toBeTruthy();

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'Period Compare Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()) as { data: { id: number } };

    const loanResponse = await request.post('/api/accounts', {
        data: {
            name: 'Period Compare Loan',
            type: 'liability',
            primary_currency: 'CAD',
        },
    });
    expect(loanResponse.ok()).toBeTruthy();
    const loan = (await loanResponse.json()) as { data: { id: number } };

    for (const period of ['202501', '202502']) {
        const rateResponse = await request.post('/api/exchange-rates', {
            data: {
                period,
                usd_cop: 4400,
                usd_cad: 0.75,
                cad_cop: 3000,
            },
        });
        expect(rateResponse.ok()).toBeTruthy();
    }

    const incomeJan = await request.post('/api/income', {
        data: {
            period: '202501',
            description: 'Salary Jan',
            line_number: 1,
            amount_cad: 5000,
        },
    });
    expect(incomeJan.ok()).toBeTruthy();

    const incomeFeb = await request.post('/api/income', {
        data: {
            period: '202502',
            description: 'Salary Feb',
            line_number: 1,
            amount_cad: 5500,
        },
    });
    expect(incomeFeb.ok()).toBeTruthy();

    const txJan = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: groceries!.id,
            account_id: bank.data.id,
            amount_cad: 1000,
            comments: 'Compare seed Jan',
        },
    });
    expect(txJan.ok()).toBeTruthy();

    const txFeb = await request.post('/api/transactions', {
        data: {
            date: '2025-02-15',
            period: '202502',
            quincena: 'Q1',
            category_id: groceries!.id,
            account_id: bank.data.id,
            amount_cad: 800,
            comments: 'Compare seed Feb',
        },
    });
    expect(txFeb.ok()).toBeTruthy();

    const balJanBank = await request.post(
        `/api/accounts/${bank.data.id}/balances`,
        {
            data: {
                period: '202501',
                recorded_balance_cad: 10000,
            },
        },
    );
    expect(balJanBank.ok()).toBeTruthy();

    const balJanLoan = await request.post(
        `/api/accounts/${loan.data.id}/balances`,
        {
            data: {
                period: '202501',
                recorded_balance_cad: 4000,
            },
        },
    );
    expect(balJanLoan.ok()).toBeTruthy();

    const balFebBank = await request.post(
        `/api/accounts/${bank.data.id}/balances`,
        {
            data: {
                period: '202502',
                recorded_balance_cad: 12000,
            },
        },
    );
    expect(balFebBank.ok()).toBeTruthy();

    const balFebLoan = await request.post(
        `/api/accounts/${loan.data.id}/balances`,
        {
            data: {
                period: '202502',
                recorded_balance_cad: 3500,
            },
        },
    );
    expect(balFebLoan.ok()).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 104: user can compare two periods side-by-side', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await seedComparisonData(request);

    // Step 1: Navigate to period comparison page
    await page.goto('/periods/compare?period_a=202501&period_b=202502');

    await expect(
        page.getByTestId('period-comparison-heading'),
    ).toBeVisible();
    await expect(page.getByTestId('period-comparison-heading')).toHaveText(
        'Period Comparison',
    );

    await page.screenshot({
        path: 'verification/test-104-period-comparison/01-page-loaded.png',
        fullPage: true,
    });

    // Step 2 & 3: Periods selected (via URL / controls)
    await expect(page.getByTestId('period-a-label')).toContainText('202501');
    await expect(page.getByTestId('period-b-label')).toContainText('202502');
    await expect(page.getByTestId('period-a-select')).toBeVisible();
    await expect(page.getByTestId('period-b-select')).toBeVisible();

    // Step 4: Income, expenses, and balances side-by-side
    await expect(page.getByTestId('period-a-income')).toContainText('$5,000.00');
    await expect(page.getByTestId('period-b-income')).toContainText('$5,500.00');
    await expect(page.getByTestId('period-a-expenses')).toContainText(
        '$1,000.00',
    );
    await expect(page.getByTestId('period-b-expenses')).toContainText('$800.00');
    await expect(page.getByTestId('period-a-assets')).toContainText(
        '$10,000.00',
    );
    await expect(page.getByTestId('period-b-assets')).toContainText(
        '$12,000.00',
    );
    await expect(page.getByTestId('period-a-liabilities')).toContainText(
        '$4,000.00',
    );
    await expect(page.getByTestId('period-b-liabilities')).toContainText(
        '$3,500.00',
    );

    await page.screenshot({
        path: 'verification/test-104-period-comparison/02-side-by-side-cards.png',
        fullPage: true,
    });

    // Step 5: Differences/changes calculated and highlighted
    await expect(page.getByTestId('comparison-row-income')).toBeVisible();
    await expect(page.getByTestId('comparison-income-difference')).toContainText(
        '+$500.00',
    );
    await expect(page.getByTestId('comparison-expenses-difference')).toContainText(
        '-$200.00',
    );
    await expect(page.getByTestId('comparison-assets-difference')).toContainText(
        '+$2,000.00',
    );
    await expect(
        page.getByTestId('comparison-liabilities-difference'),
    ).toContainText('-$500.00');
    await expect(page.getByTestId('comparison-income-percent')).toContainText(
        '+10.00%',
    );

    const incomeRow = page.getByTestId('comparison-row-income');
    await expect(incomeRow).toHaveAttribute('data-difference', '500');

    await page.getByTestId('period-comparison-table-card').screenshot({
        path: 'verification/test-104-period-comparison/03-differences-table.png',
    });

    await page.screenshot({
        path: 'verification/test-104-period-comparison/04-full-page.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
