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
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Liabilities' })).toBeVisible();

    // Canadian institutions. Several imported accounts share these names.
    await expect(page.getByText(/RBC/).first()).toBeVisible();
    await expect(page.getByText(/CIBC/).first()).toBeVisible();
    await expect(page.getByText(/TD Bank/)).toBeVisible();
    await expect(page.getByText('Wise')).toBeVisible();

    // Colombian institutions
    await expect(page.getByText(/Bancolombia/).first()).toBeVisible();
    await expect(page.getByText('Davivienda')).toBeVisible();
    await expect(page.getByText('Nequi')).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Éxito', exact: true }),
    ).toBeVisible();

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

test('feature 95: Account form validates that account name is unique', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    // Earlier tests import historical accounts, including "RBC Checking".
    resetBrowserState();
    await loginAsBrowserTestUser(page);

    await page.goto('/accounts');
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();

    // Step 1: Create account with name 'RBC Checking'
    await page.getByRole('button', { name: /Add Account/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Account' })).toBeVisible();

    await page.getByLabel('Account Name').fill('RBC Checking');
    await page.getByLabel('Account Type').click();
    await page.getByRole('option', { name: 'Bank Account' }).click();
    await page.getByLabel('Primary Currency').click();
    await page.getByRole('option', { name: 'CAD' }).click();

    await page.getByRole('button', { name: 'Save Account' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify account was created
    await expect(page.getByText('RBC Checking')).toBeVisible();

    // Step 2: Attempt to create another account with same name
    await page.getByRole('button', { name: /Add Account/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Account Name').fill('RBC Checking');
    await page.getByLabel('Account Type').click();
    await page.getByRole('option', { name: 'Bank Account' }).click();
    await page.getByLabel('Primary Currency').click();
    await page.getByRole('option', { name: 'CAD' }).click();

    await page.getByRole('button', { name: 'Save Account' }).click();

    // Step 3: Verify validation error is shown
    await expect(
        page.getByText(/An account with this name already exists/i)
    ).toBeVisible();

    // Dialog should still be open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Step 4: Change name to 'RBC Savings'
    await page.getByLabel('Account Name').clear();
    await page.getByLabel('Account Name').fill('RBC Savings');

    await page.getByRole('button', { name: 'Save Account' }).click();

    // Step 5: Verify form accepts unique name
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('RBC Savings')).toBeVisible();

    // Verify both accounts exist
    await expect(page.getByText('RBC Checking')).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
