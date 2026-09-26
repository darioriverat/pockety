import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 42-45: income entry UI supports multi-currency lines and totals', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    await page.goto('/income');
    await expect(page.getByRole('heading', { name: 'Income' })).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Add Income' }),
    ).toBeVisible();

    await page.getByRole('textbox', { name: 'Period', exact: true }).fill('202501');
    await page.getByRole('button', { name: 'Load Period' }).click();

    await page.getByRole('button', { name: 'Add Income' }).click();
    await page.getByLabel('Description').fill('Salary - Main Job');
    await page.getByLabel('Amount CAD').fill('5000');
    await page.getByRole('button', { name: 'Save Income' }).click();

    await expect(page.getByText('Salary - Main Job')).toBeVisible();
    await expect(page.getByTestId('income-total-cad')).toContainText('5,000');

    await page.getByRole('button', { name: 'Add Income' }).click();
    await page.getByLabel('Description').fill('Mixed Income');
    await page.getByLabel('Amount CAD').fill('1000');
    await page.getByLabel('Amount USD').fill('500');
    await page.getByRole('button', { name: 'Save Income' }).click();

    await expect(page.getByText('Mixed Income')).toBeVisible();

    for (let i = 3; i <= 6; i++) {
        await page.getByRole('button', { name: 'Add Income' }).click();
        await page.getByLabel('Description').fill(`Income line ${i}`);
        await page.getByLabel('Amount CAD').fill(String(100 * i));
        await page.getByRole('button', { name: 'Save Income' }).click();
        await expect(page.getByText(`Income line ${i}`)).toBeVisible();
    }

    await expect(
        page.getByText(/already has 6 income lines/i),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Add Income' }),
    ).toBeDisabled();

    expect(consoleErrors).toEqual([]);
});
