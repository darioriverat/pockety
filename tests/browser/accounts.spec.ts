import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 40: imported accounts list shows Canadian and Colombian institutions', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Import historical accounts via API (same path the Import UI uses)
    const importResponse = await page.request.post('/api/accounts/import', {
        data: { directory: 'month_sheets' },
    });
    expect(importResponse.ok()).toBeTruthy();
    const importBody = await importResponse.json();
    expect(importBody.data.accounts_created).toBeGreaterThan(0);

    await page.goto('/accounts');
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
    await expect(page.getByText('Assets')).toBeVisible();
    await expect(page.getByText('Liabilities')).toBeVisible();

    // Canadian institutions
    await expect(page.getByText(/RBC/)).toBeVisible();
    await expect(page.getByText(/CIBC/)).toBeVisible();
    await expect(page.getByText(/TD Bank/)).toBeVisible();
    await expect(page.getByText('Wise')).toBeVisible();

    // Colombian institutions
    await expect(page.getByText(/Bancolombia/)).toBeVisible();
    await expect(page.getByText('Davivienda')).toBeVisible();
    await expect(page.getByText('Nequi')).toBeVisible();
    await expect(page.getByText('Éxito')).toBeVisible();

    // Type + currencies shown on an account card
    await expect(page.getByText('Bank Account').first()).toBeVisible();
    await expect(page.getByText(/Currencies:/).first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
});

test('feature 41: Personal LOAN CIBC is correctly named as liability', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    await page.request.post('/api/accounts/import', {
        data: { directory: 'month_sheets' },
    });

    await page.goto('/accounts');

    await expect(page.getByText('Personal LOAN CIBC')).toBeVisible();
    await expect(page.getByText('Crédito Móvil **6174')).toHaveCount(0);

    // Liability section should contain the loan
    const loanCard = page.locator('text=Personal LOAN CIBC').locator('..').locator('..');
    await expect(loanCard.getByText(/Credit Card\/Loan|liability/i)).toBeVisible();
    await expect(page.getByText(/Ford Escape/)).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
