import { expect, test, type APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'session-63',
);

async function seedCurrencyPreferenceData(
    request: APIRequestContext,
): Promise<void> {
    const period = '202601';

    const rateResponse = await request.post('/api/exchange-rates', {
        data: {
            period,
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });
    expect(rateResponse.ok()).toBeTruthy();

    const incomeResponse = await request.post('/api/income', {
        data: {
            period,
            description: 'Salary for currency preference',
            amount_cad: 5000,
            amount_usd: 0,
            amount_cop: 0,
        },
    });
    expect(incomeResponse.ok()).toBeTruthy();

    const categoryResponse = await request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = categories.data.find((item) => item.code === 'C001');
    expect(category).toBeTruthy();

    const accountResponse = await request.post('/api/accounts', {
        data: {
            name: 'Currency Pref Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const account = (await accountResponse.json()) as { data: { id: number } };

    const txResponse = await request.post('/api/transactions', {
        data: {
            date: '2026-01-15',
            period,
            quincena: 'Q1',
            category_id: category!.id,
            account_id: account.data.id,
            amount_cad: 1500,
            comments: 'Currency preference expense',
        },
    });
    expect(txResponse.ok()).toBeTruthy();
}

test.beforeAll(() => {
    resetBrowserState();
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 112: user can set default currency preference for views', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await seedCurrencyPreferenceData(request);

    // Step 1-3: Preferences - set default display currency to CAD and save
    await page.goto('/preferences');
    await expect(page.getByTestId('preferences-form')).toBeVisible();
    await expect(page.getByText('Default Currency')).toBeVisible();
    await page.screenshot({
        path: path.join(verificationDir, '01-preferences-page.png'),
        fullPage: true,
    });

    await page.getByTestId('default-currency-select').click();
    await page.getByTestId('currency-option-cad').click();
    await page.getByTestId('preferences-save').click();
    await expect(page.getByTestId('preferences-success')).toBeVisible();
    await page.screenshot({
        path: path.join(verificationDir, '02-preferences-saved-cad.png'),
        fullPage: true,
    });

    // Steps 4-5: Dashboard shows amounts in CAD by default
    await page.goto('/dashboard?period=202601');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('currency-toggle')).toBeVisible();
    await expect(page.getByTestId('currency-toggle-cad')).toHaveAttribute(
        'data-state',
        'on',
    );
    await expect(page.getByTestId('dashboard-total-income')).toContainText(
        '5,000.00',
    );
    await expect(page.getByTestId('income-expense-chart-range')).toContainText(
        'CAD',
    );
    await page.screenshot({
        path: path.join(verificationDir, '03-dashboard-cad-default.png'),
        fullPage: true,
    });

    const cadIncome = await page.getByTestId('dashboard-total-income').innerText();

    // Step 6: Toggle to see other currencies
    await page.getByTestId('currency-toggle-usd').click();
    await expect(page.getByTestId('currency-toggle-usd')).toHaveAttribute(
        'data-state',
        'on',
    );
    await expect(page.getByTestId('income-expense-chart-range')).toContainText(
        'USD',
    );
    await expect(page.getByTestId('dashboard-total-income')).toContainText(
        '6,666.67',
    );
    const usdIncome = await page.getByTestId('dashboard-total-income').innerText();
    expect(usdIncome).not.toEqual(cadIncome);
    await page.screenshot({
        path: path.join(verificationDir, '04-dashboard-usd-toggle.png'),
        fullPage: true,
    });

    await page.getByTestId('currency-toggle-cop').click();
    await expect(page.getByTestId('currency-toggle-cop')).toHaveAttribute(
        'data-state',
        'on',
    );
    await expect(page.getByTestId('income-expense-chart-range')).toContainText(
        'COP',
    );
    const copIncome = await page.getByTestId('dashboard-total-income').innerText();
    expect(copIncome.replace(/\s/g, '')).toMatch(/15[.,]000[.,]000/);
    expect(copIncome).not.toEqual(usdIncome);
    await page.screenshot({
        path: path.join(verificationDir, '05-dashboard-cop-toggle.png'),
        fullPage: true,
    });

    await page.getByTestId('currency-toggle-cad').click();
    await expect(page.getByTestId('currency-toggle-cad')).toHaveAttribute(
        'data-state',
        'on',
    );
    await expect(page.getByTestId('dashboard-total-income')).toContainText(
        '5,000.00',
    );

    expect(consoleErrors).toEqual([]);
});
