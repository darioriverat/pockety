import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 62-64: financial summary shows disbursements and net operating expenses', async ({
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

    const categoriesResponse = await request.get('/api/categories');
    const categoriesPayload = await categoriesResponse.json();
    const categories: ApiCategory[] = categoriesPayload.data;

    const c001 = categories.find((category) => category.code === 'C001');
    const c044 = categories.find((category) => category.code === 'C044');
    const c045 = categories.find((category) => category.code === 'C045');
    expect(c001).toBeTruthy();
    expect(c044).toBeTruthy();
    expect(c045).toBeTruthy();

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-10',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 100,
            comments: 'Groceries for summary',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: c044!.id,
            amount_cad: 500,
            debt_component: 'principal',
            comments: 'FORD ESC CAPITAL',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: c044!.id,
            amount_cad: 50,
            debt_component: 'interest',
            comments: 'FORD ESC INTERESES',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: c045!.id,
            amount_cad: 75,
            comments: 'Depreciation entry',
        },
    });

    await page.goto('/financial-summary');

    await expect(
        page.getByRole('heading', { name: 'Financial Summary' }),
    ).toBeVisible();
    await expect(page.getByTestId('period-selector')).toBeVisible();
    await expect(page.getByTestId('financial-summary-table')).toBeVisible();
    await expect(page.getByTestId('debt-category-codes')).toBeVisible();

    for (const code of ['C009', 'C010', 'C027', 'C038', 'C039', 'C044', 'C046']) {
        await expect(page.getByTestId(`debt-code-${code}`)).toBeVisible();
    }

    // 100 + 500 + 50 + 75 = 725
    await expect(page.getByTestId('total-recorded-disbursements')).toContainText(
        '725',
    );
    // 725 - 500 principal - 75 depreciation = 150
    await expect(page.getByTestId('net-operating-expenses')).toContainText(
        '150',
    );
    await expect(page.getByTestId('debt-principal-excluded')).toContainText(
        '500',
    );
    await expect(page.getByTestId('depreciation-excluded')).toContainText('75');
    await expect(page.getByTestId('debt-interest-included')).toContainText(
        '50',
    );

    const fordRow = page.getByTestId('summary-row-C044');
    await expect(fordRow).toBeVisible();
    await expect(fordRow).toHaveAttribute('data-debt', 'true');
    await expect(page.getByTestId('total-C044')).toContainText('550');
    await expect(page.getByTestId('principal-C044')).toContainText('500');
    await expect(page.getByTestId('interest-C044')).toContainText('50');

    const depreciationRow = page.getByTestId('summary-row-C045');
    await expect(depreciationRow).toHaveAttribute('data-depreciation', 'true');
    await expect(page.getByTestId('total-C045')).toContainText('75');

    expect(consoleErrors).toEqual([]);
});
