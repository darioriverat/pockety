# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accounts.spec.ts >> feature 40: imported accounts list shows Canadian and Colombian institutions
- Location: tests/browser/accounts.spec.ts:12:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Liabilities')
Expected: visible
Error: strict mode violation: getByText('Liabilities') resolved to 2 elements:
    1) <p class="text-muted-foreground">Manage your bank accounts, investments, and liabi…</p> aka getByText('Manage your bank accounts,')
    2) <h2 class="text-2xl font-semibold tracking-tight">Liabilities</h2> aka getByRole('heading', { name: 'Liabilities' })

Call log:
  - Expect "toBeVisible" getByText('Liabilities') with timeout 5000ms
  - waiting for getByText('Liabilities')

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - generic [ref=f1e7]:
      - list [ref=f1e9]:
        - listitem [ref=f1e10]:
          - link "Laravel" [ref=f1e11] [cursor=pointer]:
            - /url: /dashboard
      - generic [ref=f1e18]:
        - generic [ref=f1e19]: Platform
        - list [ref=f1e20]:
          - listitem [ref=f1e21]:
            - link "Dashboard" [ref=f1e22] [cursor=pointer]:
              - /url: /dashboard
          - listitem [ref=f1e29]:
            - link "Accounts" [ref=f1e30] [cursor=pointer]:
              - /url: /accounts
          - listitem [ref=f1e34]:
            - link "Income" [ref=f1e35] [cursor=pointer]:
              - /url: /income
          - listitem [ref=f1e40]:
            - link "Reconciliation" [ref=f1e41] [cursor=pointer]:
              - /url: /reconciliation
          - listitem [ref=f1e47]:
            - link "Categories" [ref=f1e48] [cursor=pointer]:
              - /url: /categories
          - listitem [ref=f1e54]:
            - link "Transactions" [ref=f1e55] [cursor=pointer]:
              - /url: /transactions
          - listitem [ref=f1e60]:
            - link "Budgets" [ref=f1e61] [cursor=pointer]:
              - /url: /budgets
          - listitem [ref=f1e66]:
            - link "Financial Summary" [ref=f1e67] [cursor=pointer]:
              - /url: /financial-summary
          - listitem [ref=f1e71]:
            - link "Balance Sheet" [ref=f1e72] [cursor=pointer]:
              - /url: /balance-sheet
          - listitem [ref=f1e76]:
            - link "BS Time Series" [ref=f1e77] [cursor=pointer]:
              - /url: /balance-sheet/time-series
          - listitem [ref=f1e82]:
            - link "Exchange Rates" [ref=f1e83] [cursor=pointer]:
              - /url: /exchange-rates
          - listitem [ref=f1e87]:
            - link "Import" [ref=f1e88] [cursor=pointer]:
              - /url: /import
      - generic [ref=f1e93]:
        - list [ref=f1e96]:
          - listitem [ref=f1e97]:
            - link "Repository" [ref=f1e98] [cursor=pointer]:
              - /url: https://github.com/laravel/react-starter-kit
          - listitem [ref=f1e105]:
            - link "Documentation" [ref=f1e106] [cursor=pointer]:
              - /url: https://laravel.com/docs/starter-kits#react
        - list [ref=f1e110]:
          - listitem [ref=f1e111]:
            - button "BU Browser Test User" [ref=f1e112]:
              - generic [ref=f1e113]: BU
              - generic [ref=f1e115]: Browser Test User
    - main [ref=f1e120]:
      - button "Toggle sidebar" [ref=f1e123]
      - generic [ref=f1e125]:
        - generic [ref=f1e126]:
          - generic [ref=f1e127]:
            - heading "Accounts" [level=1] [ref=f1e128]
            - paragraph [ref=f1e129]: Manage your bank accounts, investments, and liabilities
          - button "Add Account" [ref=f1e130]
        - generic [ref=f1e131]:
          - heading "Assets" [level=2] [ref=f1e132]
          - generic [ref=f1e133]:
            - generic [ref=f1e134]:
              - generic [ref=f1e135]:
                - generic [ref=f1e136]:
                  - generic [ref=f1e137]: Bancolombia
                  - generic [ref=f1e143]: Bank Account
                - generic [ref=f1e144]: "Currencies: COP"
              - button "Manage Balances" [ref=f1e148]
            - generic [ref=f1e149]:
              - generic [ref=f1e150]:
                - generic [ref=f1e151]:
                  - generic [ref=f1e152]: Bancolombia Mamá
                  - generic [ref=f1e158]: Bank Account
                - generic [ref=f1e159]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e163]
            - generic [ref=f1e164]:
              - generic [ref=f1e165]:
                - generic [ref=f1e166]:
                  - generic [ref=f1e167]: CIBC Checking
                  - generic [ref=f1e173]: Bank Account
                - generic [ref=f1e174]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e178]
            - generic [ref=f1e179]:
              - generic [ref=f1e180]:
                - generic [ref=f1e181]:
                  - generic [ref=f1e182]: Davivienda
                  - generic [ref=f1e188]: Bank Account
                - generic [ref=f1e189]: "Currencies: COP"
              - button "Manage Balances" [ref=f1e193]
            - generic [ref=f1e194]:
              - generic [ref=f1e195]:
                - generic [ref=f1e196]:
                  - generic [ref=f1e197]: Efectivo
                  - generic [ref=f1e203]: Bank Account
                - generic [ref=f1e204]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e208]
            - generic [ref=f1e209]:
              - generic [ref=f1e210]:
                - generic [ref=f1e211]:
                  - generic [ref=f1e212]: Nequi
                  - generic [ref=f1e218]: Bank Account
                - generic [ref=f1e219]: "Currencies: COP"
              - button "Manage Balances" [ref=f1e223]
            - generic [ref=f1e224]:
              - generic [ref=f1e225]:
                - generic [ref=f1e226]:
                  - generic [ref=f1e227]: RBC Checking
                  - generic [ref=f1e233]: Bank Account
                - generic [ref=f1e234]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e238]
            - generic [ref=f1e239]:
              - generic [ref=f1e240]:
                - generic [ref=f1e241]:
                  - generic [ref=f1e242]: RBC Savings
                  - generic [ref=f1e248]: Bank Account
                - generic [ref=f1e249]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e253]
            - generic [ref=f1e254]:
              - generic [ref=f1e255]:
                - generic [ref=f1e256]:
                  - generic [ref=f1e257]: TD Bank Diana
                  - generic [ref=f1e263]: Bank Account
                - generic [ref=f1e264]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e268]
            - generic [ref=f1e269]:
              - generic [ref=f1e270]:
                - generic [ref=f1e271]:
                  - generic [ref=f1e272]: Wise
                  - generic [ref=f1e278]: Bank Account
                - generic [ref=f1e279]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e283]
        - generic [ref=f1e284]:
          - heading "Liabilities" [level=2] [ref=f1e285]
          - generic [ref=f1e286]:
            - generic [ref=f1e287]:
              - generic [ref=f1e288]:
                - generic [ref=f1e289]:
                  - generic [ref=f1e290]: Banc. Mastercard
                  - generic [ref=f1e296]: Credit Card/Loan
                - generic [ref=f1e297]: "Currencies: USD, COP"
              - button "Manage Balances" [ref=f1e301]
            - generic [ref=f1e302]:
              - generic [ref=f1e303]:
                - generic [ref=f1e304]:
                  - generic [ref=f1e305]: Banc. Visa
                  - generic [ref=f1e311]: Credit Card/Loan
                - generic [ref=f1e312]: "Currencies: COP"
              - button "Manage Balances" [ref=f1e316]
            - generic [ref=f1e317]:
              - generic [ref=f1e318]:
                - generic [ref=f1e319]:
                  - generic [ref=f1e320]: Canadian Tire MC
                  - generic [ref=f1e326]: Credit Card/Loan
                - generic [ref=f1e327]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e331]
            - generic [ref=f1e332]:
              - generic [ref=f1e333]:
                - generic [ref=f1e334]:
                  - generic [ref=f1e335]: CIBC Mastercard
                  - generic [ref=f1e341]: Credit Card/Loan
                - generic [ref=f1e342]: "Currencies: CAD"
              - button "Manage Balances" [ref=f1e346]
            - generic [ref=f1e347]:
              - generic [ref=f1e349]:
                - generic [ref=f1e350]: Crédito Móvil **6191
                - generic [ref=f1e356]: Credit Card/Loan
              - button "Manage Balances" [ref=f1e358]
            - generic [ref=f1e359]:
              - generic [ref=f1e360]:
                - generic [ref=f1e361]:
                  - generic [ref=f1e362]: CX Fijo
                  - generic [ref=f1e368]: Credit Card/Loan
                - generic [ref=f1e369]: "Currencies: COP"
              - button "Manage Balances" [ref=f1e373]
            - generic [ref=f1e374]:
              - generic [ref=f1e375]:
                - generic [ref=f1e376]:
                  - generic [ref=f1e377]: Éxito
                  - generic [ref=f1e383]: Credit Card/Loan
                - generic [ref=f1e385]:
                  - generic [ref=f1e386]: "Currencies: COP"
                  - generic [ref=f1e387]: Éxito store card (CRÉDITO ÉXITO) — liability tracked for Colombian credit payments
              - button "Manage Balances" [ref=f1e389]
            - generic [ref=f1e390]:
              - generic [ref=f1e391]:
                - generic [ref=f1e392]:
                  - generic [ref=f1e393]: Personal LOAN CIBC
                  - generic [ref=f1e399]: Credit Card/Loan
                - generic [ref=f1e401]:
                  - generic [ref=f1e402]: "Currencies: CAD"
                  - generic [ref=f1e403]: CIBC personal loan funding the Ford Escape vehicle
              - button "Manage Balances" [ref=f1e405]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import {
  3  |     loginAsBrowserTestUser,
  4  |     resetBrowserState,
  5  |     trackConsoleErrors,
  6  | } from './helpers';
  7  | 
  8  | test.beforeAll(() => {
  9  |     resetBrowserState();
  10 | });
  11 | 
  12 | test('feature 40: imported accounts list shows Canadian and Colombian institutions', async ({
  13 |     page,
  14 | }) => {
  15 |     const consoleErrors = trackConsoleErrors(page);
  16 | 
  17 |     await loginAsBrowserTestUser(page);
  18 | 
  19 |     // Import historical accounts via API (same path the Import UI uses)
  20 |     const importResponse = await page.request.post('/api/accounts/import', {
  21 |         data: { directory: 'month_sheets' },
  22 |     });
  23 |     expect(importResponse.ok()).toBeTruthy();
  24 |     const importBody = await importResponse.json();
  25 |     expect(importBody.data.accounts_created).toBeGreaterThan(0);
  26 | 
  27 |     await page.goto('/accounts');
  28 |     await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
  29 |     await expect(page.getByText('Assets')).toBeVisible();
> 30 |     await expect(page.getByText('Liabilities')).toBeVisible();
     |                                                 ^ Error: expect(locator).toBeVisible() failed
  31 | 
  32 |     // Canadian institutions
  33 |     await expect(page.getByText(/RBC/)).toBeVisible();
  34 |     await expect(page.getByText(/CIBC/)).toBeVisible();
  35 |     await expect(page.getByText(/TD Bank/)).toBeVisible();
  36 |     await expect(page.getByText('Wise')).toBeVisible();
  37 | 
  38 |     // Colombian institutions
  39 |     await expect(page.getByText(/Bancolombia/)).toBeVisible();
  40 |     await expect(page.getByText('Davivienda')).toBeVisible();
  41 |     await expect(page.getByText('Nequi')).toBeVisible();
  42 |     await expect(page.getByText('Éxito')).toBeVisible();
  43 | 
  44 |     // Type + currencies shown on an account card
  45 |     await expect(page.getByText('Bank Account').first()).toBeVisible();
  46 |     await expect(page.getByText(/Currencies:/).first()).toBeVisible();
  47 | 
  48 |     expect(consoleErrors).toEqual([]);
  49 | });
  50 | 
  51 | test('feature 41: Personal LOAN CIBC is correctly named as liability', async ({
  52 |     page,
  53 | }) => {
  54 |     const consoleErrors = trackConsoleErrors(page);
  55 | 
  56 |     await loginAsBrowserTestUser(page);
  57 | 
  58 |     await page.request.post('/api/accounts/import', {
  59 |         data: { directory: 'month_sheets' },
  60 |     });
  61 | 
  62 |     await page.goto('/accounts');
  63 | 
  64 |     await expect(page.getByText('Personal LOAN CIBC')).toBeVisible();
  65 |     await expect(page.getByText('Crédito Móvil **6174')).toHaveCount(0);
  66 | 
  67 |     // Liability section should contain the loan
  68 |     const loanCard = page.locator('text=Personal LOAN CIBC').locator('..').locator('..');
  69 |     await expect(loanCard.getByText(/Credit Card\/Loan|liability/i)).toBeVisible();
  70 |     await expect(page.getByText(/Ford Escape/)).toBeVisible();
  71 | 
  72 |     expect(consoleErrors).toEqual([]);
  73 | });
  74 | 
```