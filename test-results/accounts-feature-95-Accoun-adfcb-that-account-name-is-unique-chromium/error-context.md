# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accounts.spec.ts >> feature 95: Account form validates that account name is unique
- Location: tests/browser/accounts.spec.ts:75:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('RBC Checking')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('RBC Checking') with timeout 5000ms
  - waiting for getByText('RBC Checking')

```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import {
  3   |     loginAsBrowserTestUser,
  4   |     resetBrowserState,
  5   |     trackConsoleErrors,
  6   | } from './helpers';
  7   | 
  8   | test.beforeAll(() => {
  9   |     resetBrowserState();
  10  | });
  11  | 
  12  | test('feature 40: imported accounts list shows Canadian and Colombian institutions', async ({
  13  |     page,
  14  | }) => {
  15  |     const consoleErrors = trackConsoleErrors(page);
  16  | 
  17  |     await loginAsBrowserTestUser(page);
  18  | 
  19  |     // Import historical accounts via API (same path the Import UI uses)
  20  |     const importResponse = await page.request.post('/api/accounts/import', {
  21  |         data: { directory: 'month_sheets' },
  22  |     });
  23  |     expect(importResponse.ok()).toBeTruthy();
  24  |     const importBody = await importResponse.json();
  25  |     expect(importBody.data.accounts_created).toBeGreaterThan(0);
  26  | 
  27  |     await page.goto('/accounts');
  28  |     await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
  29  |     await expect(page.getByText('Assets')).toBeVisible();
  30  |     await expect(page.getByText('Liabilities')).toBeVisible();
  31  | 
  32  |     // Canadian institutions
  33  |     await expect(page.getByText(/RBC/)).toBeVisible();
  34  |     await expect(page.getByText(/CIBC/)).toBeVisible();
  35  |     await expect(page.getByText(/TD Bank/)).toBeVisible();
  36  |     await expect(page.getByText('Wise')).toBeVisible();
  37  | 
  38  |     // Colombian institutions
  39  |     await expect(page.getByText(/Bancolombia/)).toBeVisible();
  40  |     await expect(page.getByText('Davivienda')).toBeVisible();
  41  |     await expect(page.getByText('Nequi')).toBeVisible();
  42  |     await expect(page.getByText('Éxito')).toBeVisible();
  43  | 
  44  |     // Type + currencies shown on an account card
  45  |     await expect(page.getByText('Bank Account').first()).toBeVisible();
  46  |     await expect(page.getByText(/Currencies:/).first()).toBeVisible();
  47  | 
  48  |     expect(consoleErrors).toEqual([]);
  49  | });
  50  | 
  51  | test('feature 41: Personal LOAN CIBC is correctly named as liability', async ({
  52  |     page,
  53  | }) => {
  54  |     const consoleErrors = trackConsoleErrors(page);
  55  | 
  56  |     await loginAsBrowserTestUser(page);
  57  | 
  58  |     await page.request.post('/api/accounts/import', {
  59  |         data: { directory: 'month_sheets' },
  60  |     });
  61  | 
  62  |     await page.goto('/accounts');
  63  | 
  64  |     await expect(page.getByText('Personal LOAN CIBC')).toBeVisible();
  65  |     await expect(page.getByText('Crédito Móvil **6174')).toHaveCount(0);
  66  | 
  67  |     // Liability section should contain the loan
  68  |     const loanCard = page.locator('text=Personal LOAN CIBC').locator('..').locator('..');
  69  |     await expect(loanCard.getByText(/Credit Card\/Loan|liability/i)).toBeVisible();
  70  |     await expect(page.getByText(/Ford Escape/)).toBeVisible();
  71  | 
  72  |     expect(consoleErrors).toEqual([]);
  73  | });
  74  | 
  75  | test('feature 95: Account form validates that account name is unique', async ({
  76  |     page,
  77  | }) => {
  78  |     const consoleErrors = trackConsoleErrors(page);
  79  | 
  80  |     await loginAsBrowserTestUser(page);
  81  | 
  82  |     await page.goto('/accounts');
  83  |     await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
  84  | 
  85  |     // Step 1: Create account with name 'RBC Checking'
  86  |     await page.getByRole('button', { name: /Add Account/i }).click();
  87  |     await expect(page.getByRole('dialog')).toBeVisible();
  88  |     await expect(page.getByRole('heading', { name: 'Add Account' })).toBeVisible();
  89  | 
  90  |     await page.getByLabel('Account Name').fill('RBC Checking');
  91  |     await page.getByLabel('Account Type').click();
  92  |     await page.getByRole('option', { name: 'Bank Account' }).click();
  93  |     await page.getByLabel('Primary Currency').click();
  94  |     await page.getByRole('option', { name: 'CAD' }).click();
  95  | 
  96  |     await page.getByRole('button', { name: 'Save Account' }).click();
  97  |     await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  98  | 
  99  |     // Verify account was created
> 100 |     await expect(page.getByText('RBC Checking')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  101 | 
  102 |     // Step 2: Attempt to create another account with same name
  103 |     await page.getByRole('button', { name: /Add Account/i }).click();
  104 |     await expect(page.getByRole('dialog')).toBeVisible();
  105 | 
  106 |     await page.getByLabel('Account Name').fill('RBC Checking');
  107 |     await page.getByLabel('Account Type').click();
  108 |     await page.getByRole('option', { name: 'Bank Account' }).click();
  109 |     await page.getByLabel('Primary Currency').click();
  110 |     await page.getByRole('option', { name: 'CAD' }).click();
  111 | 
  112 |     await page.getByRole('button', { name: 'Save Account' }).click();
  113 | 
  114 |     // Step 3: Verify validation error is shown
  115 |     await expect(
  116 |         page.getByText(/An account with this name already exists/i)
  117 |     ).toBeVisible();
  118 | 
  119 |     // Dialog should still be open
  120 |     await expect(page.getByRole('dialog')).toBeVisible();
  121 | 
  122 |     // Step 4: Change name to 'RBC Savings'
  123 |     await page.getByLabel('Account Name').clear();
  124 |     await page.getByLabel('Account Name').fill('RBC Savings');
  125 | 
  126 |     await page.getByRole('button', { name: 'Save Account' }).click();
  127 | 
  128 |     // Step 5: Verify form accepts unique name
  129 |     await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  130 |     await expect(page.getByText('RBC Savings')).toBeVisible();
  131 | 
  132 |     // Verify both accounts exist
  133 |     await expect(page.getByText('RBC Checking')).toBeVisible();
  134 | 
  135 |     expect(consoleErrors).toEqual([]);
  136 | });
  137 | 
```