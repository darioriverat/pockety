import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
    type ApiCategory,
    type ApiTransaction,
    type TransactionPayload,
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function openTransactionsPage(page: Page): Promise<void> {
    await page.goto('/transactions');

    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();

    // Shared period defaults to January 2025; these tests use January 2026 fixtures.
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'January 2026', exact: true }).click();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'January 2026',
    );
}

async function openAddTransactionDialog(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Add Transaction' }).click();

    await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible();
}

function getDialogCombobox(page: Page, label: string) {
    return page
        .locator('[data-slot="dialog-content"]')
        .getByText(label, { exact: true })
        .locator('..')
        .getByRole('combobox')
        .first();
}

async function selectOption(
    page: Page,
    label: 'Quincena' | 'Category' | 'Account' | 'Deposit account' | 'Currency' | 'Debt Component',
    option: string,
): Promise<void> {
    const dialog = page.getByTestId('transaction-form-dialog');

    if (label === 'Debt Component') {
        const nativeSelect = dialog.getByTestId('debt-component-select');
        await expect(nativeSelect).toBeVisible();
        const value =
            option === 'Principal'
                ? 'principal'
                : option === 'Interest'
                  ? 'interest'
                  : 'none';
        await nativeSelect.selectOption(value);
        await expect(nativeSelect).toHaveValue(value);
        return;
    }

    const trigger = dialog.getByRole('combobox', { name: label });
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.getByRole('option', { name: option, exact: true }).click();
    await expect(trigger).toContainText(option);
}

async function fillTransactionForm(
    page: Page,
    values: {
        date: string;
        period: string;
        quincena: 'Q1' | 'Q2';
        category: string;
        account?: string;
        currency: 'CAD' | 'USD' | 'COP';
        amount: string;
        comments?: string;
        isRecurring?: boolean;
        isCredit?: boolean;
        isDebtPayment?: boolean;
        debtComponent?: 'Principal' | 'Interest';
    },
): Promise<void> {
    const dialog = page.getByTestId('transaction-form-dialog');

    await dialog.getByTestId('transaction-date-input').fill(values.date);
    await dialog.getByTestId('transaction-period-input').fill(values.period);
    await selectOption(page, 'Quincena', values.quincena);
    await selectOption(page, 'Category', values.category);
    if (values.account) {
        const accountLabel = values.category.includes('I01')
            ? 'Deposit account'
            : 'Account';
        await selectOption(page, accountLabel, values.account);
    }
    await selectOption(page, 'Currency', values.currency);
    await dialog.getByTestId('transaction-amount-input').fill(values.amount);

    if (values.comments !== undefined) {
        await dialog.getByLabel('Comments').fill(values.comments);
    }

    if (values.isRecurring) {
        await dialog.getByLabel('Recurring transaction').click();
    }

    if (values.isCredit) {
        await dialog.getByLabel('Credit (refund / deposit)').click();
    }

    if (values.isDebtPayment) {
        await dialog.getByLabel('Paying a debt (cash source)').click();
    }

    if (values.debtComponent) {
        await expect(dialog.getByLabel('Debt Component')).toBeVisible();
        await selectOption(page, 'Debt Component', values.debtComponent);
    }
}

async function submitTransactionForm(page: Page, buttonName: 'Create' | 'Update'): Promise<void> {
    await page.getByRole('button', { name: buttonName }).click();
    await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
}

async function getCategories(request: APIRequestContext): Promise<ApiCategory[]> {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();

    const payload = (await response.json()) as { data: ApiCategory[] };
    return payload.data;
}

async function getCategoryByCode(
    request: APIRequestContext,
    code: string,
): Promise<ApiCategory> {
    const categories = await getCategories(request);
    const category = categories.find((item) => item.code === code);

    if (!category) {
        throw new Error(`Category ${code} was not found in the seeded catalog.`);
    }

    return category;
}

async function getTransactions(request: APIRequestContext): Promise<ApiTransaction[]> {
    const response = await request.get('/api/transactions');
    expect(response.ok()).toBeTruthy();

    const payload = (await response.json()) as { data: ApiTransaction[] };
    return payload.data;
}

async function getTransactionByComments(
    request: APIRequestContext,
    comments: string,
): Promise<ApiTransaction> {
    const transactions = await getTransactions(request);
    const transaction = transactions.find((item) => item.comments === comments);

    if (!transaction) {
        throw new Error(`Transaction with comments "${comments}" was not found.`);
    }

    return transaction;
}

async function createTransaction(
    request: APIRequestContext,
    payload: TransactionPayload,
): Promise<ApiTransaction> {
    const response = await request.post('/api/transactions', { data: payload });
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as { data: ApiTransaction };
    return body.data;
}

async function createAccount(
    request: APIRequestContext,
    name: string,
): Promise<{ id: number; name: string }> {
    const response = await request.post('/api/accounts', {
        data: {
            name,
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as { data: { id: number; name: string } };
    return body.data;
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 5: user can create a CAD expense transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-5-cad-transaction';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-05',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        currency: 'CAD',
        amount: '100.50',
        comments,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('$100.50');
    await expect(transactionCard).toContainText('CAD');
    await expect(transactionCard).toContainText('2026-01-05 | Period: 202601 - Q1');
    await expect(transactionCard).toContainText('C001 - Groceries');
    await expect(transactionCard).toContainText(comments);

    await page.screenshot({
        path: 'verification/test-5-cad-transaction/01-created-cad-transaction.png',
        fullPage: true,
    });

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.amount_cad).toBe(100.5);
    expect(transaction.amount_usd).toBeNull();
    expect(transaction.amount_cop).toBeNull();

    expect(consoleErrors).toEqual([]);
});

test('feature 6: user can create a USD expense transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-6-usd-transaction';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-10',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        currency: 'USD',
        amount: '50.00',
        comments,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('$50.00');
    await expect(transactionCard).toContainText('USD');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.amount_cad).toBeNull();
    expect(transaction.amount_usd).toBe(50);
    expect(transaction.amount_cop).toBeNull();

    expect(consoleErrors).toEqual([]);
});

test('feature 7: user can create a COP expense transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-7-cop-transaction';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-15',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        currency: 'COP',
        amount: '500000',
        comments,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('COP');
    await expect(transactionCard).toContainText(comments);

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.amount_cad).toBeNull();
    expect(transaction.amount_usd).toBeNull();
    expect(transaction.amount_cop).toBe(500000);

    expect(consoleErrors).toEqual([]);
});

test('feature 8: transactions reject multiple currency amounts', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const category = await getCategoryByCode(request, 'C001');

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    await expect(getDialogCombobox(page, 'Currency')).toBeVisible();
    await expect(page.getByTestId('transaction-amount-input')).toBeVisible();
    await expect(getDialogCombobox(page, 'Currency')).toHaveCount(1);
    await expect(page.getByTestId('transaction-amount-input')).toHaveCount(1);

    const response = await request.post('/api/transactions', {
        data: {
            date: '2026-01-20',
            period: '202601',
            quincena: 'Q1',
            category_id: category.id,
            amount_cad: 100,
            amount_usd: 25,
        },
    });

    expect(response.status()).toBe(422);

    const payload = (await response.json()) as { error: string };

    expect(payload.error).toBe(
        'Only one currency amount can be provided per transaction',
    );

    expect(consoleErrors).toEqual([]);
});

test('feature 9: transaction category is validated against the category catalog', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    const response = await request.post('/api/transactions', {
        data: {
            date: '2026-01-21',
            period: '202601',
            quincena: 'Q1',
            category_id: 999999,
            amount_cad: 10,
        },
    });

    expect(response.status()).toBe(422);

    const payload = (await response.json()) as {
        message: string;
        errors: {
            category_id?: string[];
        };
    };

    expect(payload.errors.category_id).toBeTruthy();
    expect(payload.message).toContain('category id');

    expect(consoleErrors).toEqual([]);
});

test('feature 10: transactions display category descriptions from the category lookup', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-10-category-lookup';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-22',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        currency: 'CAD',
        amount: '19.99',
        comments,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('C001 - Groceries');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.category.code).toBe('C001');
    expect(transaction.category.name_en).toBe('Groceries');
    expect(transaction.category.name_es).toBe('MERCADO');

    expect(consoleErrors).toEqual([]);
});

test('feature 11: user can mark a transaction as recurring', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-11-recurring-transaction';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-23',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        currency: 'CAD',
        amount: '30.00',
        comments,
        isRecurring: true,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('Recurring');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.is_recurring).toBe(true);

    expect(consoleErrors).toEqual([]);
});

test('user can mark a transaction as a credit refund or deposit', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `feature-credit-${Date.now()}`;

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-23',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        currency: 'CAD',
        amount: '25.00',
        comments,
        isCredit: true,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('Credit');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.is_credit).toBe(true);

    expect(consoleErrors).toEqual([]);
});

test('user can mark a complementary spend as paying a debt', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `feature-debt-payment-${Date.now()}`;
    const account = await createAccount(request, 'Debt Payment Checking');

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-23',
        period: '202601',
        quincena: 'Q1',
        category: 'C001 - Groceries',
        account: account.name,
        currency: 'CAD',
        amount: '110.00',
        comments,
        isDebtPayment: true,
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('Debt payment');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.is_debt_payment).toBe(true);
    expect(transaction.account_id).toBe(account.id);

    expect(consoleErrors).toEqual([]);
});

test('feature 12: debt payment transactions can store principal as the debt component', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-12-debt-principal';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-24',
        period: '202601',
        quincena: 'Q1',
        category: 'C044 - Ford Escape Auto Loan Payment',
        currency: 'CAD',
        amount: '75.00',
        comments,
        debtComponent: 'Principal',
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('Debt Component: principal');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.debt_component).toBe('principal');

    expect(consoleErrors).toEqual([]);
});

test('feature 13: debt payment transactions can store interest as the debt component', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-13-debt-interest';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-25',
        period: '202601',
        quincena: 'Q1',
        category: 'C044 - Ford Escape Auto Loan Payment',
        currency: 'CAD',
        amount: '25.00',
        comments,
        debtComponent: 'Interest',
    });
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('Debt Component: interest');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.debt_component).toBe('interest');

    expect(consoleErrors).toEqual([]);
});

test('feature 14: non-debt transactions do not require a debt component', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-14-non-debt';

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await selectOption(page, 'Category', 'C001 - Groceries');
    await expect(page.getByText('Debt Component')).toHaveCount(0);
    await selectOption(page, 'Currency', 'CAD');
    await page.getByTestId('transaction-date-input').fill('2026-01-26');
    await page.getByTestId('transaction-period-input').fill('202601');
    await page.getByTestId('transaction-amount-input').fill('44.00');
    await page.getByLabel('Comments').fill(comments);
    await submitTransactionForm(page, 'Create');

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.debt_component).toBeNull();

    expect(consoleErrors).toEqual([]);
});

test('feature 14b: income category transactions deposit into the selected account', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = 'feature-14b-income-deposit';
    const account = await createAccount(request, 'Income Deposit Checking');

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);
    await fillTransactionForm(page, {
        date: '2026-01-27',
        period: '202601',
        quincena: 'Q1',
        category: 'I01 - Salary',
        account: account.name,
        currency: 'CAD',
        amount: '500.00',
        comments,
    });
    await expect(page.getByTestId('income-account-hint')).toBeVisible();
    await expect(page.getByTestId('account-none-option')).toHaveCount(0);
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toContainText('Income');
    await expect(transactionCard).toContainText(account.name);

    const transaction = await getTransactionByComments(request, comments);

    expect(transaction.account_id).toBe(account.id);
    expect(transaction.category.is_income_category).toBe(true);

    expect(consoleErrors).toEqual([]);
});

test('feature 15: users can edit an existing transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const category = await getCategoryByCode(request, 'C001');
    const originalComments = 'feature-15-before-edit';
    const updatedComments = 'feature-15-after-edit';

    await createTransaction(request, {
        date: '2026-01-27',
        period: '202601',
        quincena: 'Q1',
        category_id: category.id,
        amount_cad: 90,
        comments: originalComments,
    });

    await openTransactionsPage(page);

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: originalComments });

    await transactionCard.getByTestId('edit-transaction-button').click();
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible();
    await page.getByTestId('transaction-amount-input').fill('125.75');
    await page.getByLabel('Comments').fill(updatedComments);
    await submitTransactionForm(page, 'Update');

    const updatedCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: updatedComments });

    await expect(updatedCard).toContainText('$125.75');
    await expect(page.getByText(originalComments)).toHaveCount(0);

    const transaction = await getTransactionByComments(request, updatedComments);

    expect(transaction.amount_cad).toBe(125.75);

    expect(consoleErrors).toEqual([]);
});

test('feature 16: users can delete an existing transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const category = await getCategoryByCode(request, 'C001');
    const comments = 'feature-16-delete-transaction';

    await createTransaction(request, {
        date: '2026-01-28',
        period: '202601',
        quincena: 'Q1',
        category_id: category.id,
        amount_cad: 60,
        comments,
    });

    await openTransactionsPage(page);

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await transactionCard.getByTestId('delete-transaction-button').click();
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();
    await page.getByTestId('delete-confirm-button').click();

    await expect(
        page.locator('[data-slot="card"]').filter({ hasText: comments }),
    ).toHaveCount(0);

    const transactions = await getTransactions(request);

    expect(transactions.find((transaction) => transaction.comments === comments)).toBeUndefined();

    expect(consoleErrors).toEqual([]);
});

test('feature 93: transaction form rejects a zero amount and accepts a negative amount', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `feature-93-amount-${Date.now()}`;

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    await page.getByTestId('transaction-date-input').fill('2026-01-15');
    await page.getByTestId('transaction-period-input').fill('202601');
    await selectOption(page, 'Quincena', 'Q1');
    await selectOption(page, 'Category', 'C001 - Groceries');
    await selectOption(page, 'Currency', 'CAD');
    await page.getByTestId('transaction-amount-input').fill('0');
    await page.getByLabel('Comments').fill(comments);

    await page.getByRole('button', { name: 'Create' }).click();

    const amountError = page.getByTestId('amount-error');
    await expect(amountError).toBeVisible();
    await expect(amountError).toContainText(/cannot be zero/i);
    await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-93-amount-positive/01-zero-amount-rejected.png',
        fullPage: false,
    });

    await page.getByTestId('transaction-amount-input').fill('-100.50');
    await submitTransactionForm(page, 'Create');

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(transactionCard).toBeVisible();
    await expect(transactionCard).toContainText('-$100.50');

    const transaction = await getTransactionByComments(request, comments);
    expect(transaction.amount_cad).toBe(-100.5);

    await page.screenshot({
        path: 'verification/test-93-amount-positive/02-negative-amount-accepted.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 94: transaction form validates that date is a valid date', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `feature-94-date-${Date.now()}`;

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    await page.getByTestId('transaction-date-input').fill('2025-13-45');
    await page.getByTestId('transaction-period-input').fill('202601');
    await selectOption(page, 'Quincena', 'Q1');
    await selectOption(page, 'Category', 'C001 - Groceries');
    await selectOption(page, 'Currency', 'CAD');
    await page.getByTestId('transaction-amount-input').fill('100.50');
    await page.getByLabel('Comments').fill(comments);

    await page.getByRole('button', { name: 'Create' }).click();

    const dateError = page.getByTestId('date-error');
    await expect(dateError).toBeVisible();
    await expect(dateError).toContainText(/valid date/i);
    await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-94-date-valid/01-invalid-date-rejected.png',
        fullPage: false,
    });

    await page.getByTestId('transaction-date-input').fill('2026-01-15');
    await submitTransactionForm(page, 'Create');

    await expect(
        page.locator('[data-slot="card"]').filter({ hasText: comments }),
    ).toBeVisible();

    await page.screenshot({
        path: 'verification/test-94-date-valid/02-valid-date-accepted.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 83: system validates period format as YYYYMM', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `feature-83-period-${Date.now()}`;

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    await page.getByTestId('transaction-date-input').fill('2025-01-15');
    await page.getByTestId('transaction-period-input').fill('2025-01');
    await selectOption(page, 'Quincena', 'Q1');
    await selectOption(page, 'Category', 'C001 - Groceries');
    await selectOption(page, 'Currency', 'CAD');
    await page.getByTestId('transaction-amount-input').fill('42.00');
    await page.getByLabel('Comments').fill(comments);

    await page.getByRole('button', { name: 'Create' }).click();

    const periodError = page.getByTestId('period-error');
    await expect(periodError).toBeVisible();
    await expect(periodError).toContainText(/YYYYMM/i);
    await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-83-period-format/01-invalid-period-2025-01.png',
        fullPage: false,
    });

    await page.getByTestId('transaction-period-input').fill('01/2025');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(periodError).toBeVisible();
    await expect(periodError).toContainText(/YYYYMM/i);

    await page.screenshot({
        path: 'verification/test-83-period-format/02-invalid-period-01-2025.png',
        fullPage: false,
    });

    await page.getByTestId('transaction-period-input').fill('202601');
    await submitTransactionForm(page, 'Create');

    await expect(
        page.locator('[data-slot="card"]').filter({ hasText: comments }),
    ).toBeVisible();

    await page.screenshot({
        path: 'verification/test-83-period-format/03-valid-period-accepted.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 84: system validates quincena as Q1 or Q2 only', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `feature-84-quincena-${Date.now()}`;

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    await page.getByTestId('transaction-date-input').fill('2026-01-16');
    await page.getByTestId('transaction-period-input').fill('202601');

    await getDialogCombobox(page, 'Quincena').click();
    const options = page.getByRole('option');
    await expect(options).toHaveCount(2);
    await expect(page.getByRole('option', { name: 'Q1', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Q2', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Q3' })).toHaveCount(0);

    await page.screenshot({
        path: 'verification/test-84-quincena/01-quincena-options.png',
        fullPage: false,
    });

    await page.getByRole('option', { name: 'Q1', exact: true }).click();
    await selectOption(page, 'Category', 'C001 - Groceries');
    await selectOption(page, 'Currency', 'CAD');
    await page.getByTestId('transaction-amount-input').fill('15.00');
    await page.getByLabel('Comments').fill(comments);
    await submitTransactionForm(page, 'Create');

    await expect(
        page.locator('[data-slot="card"]').filter({ hasText: comments }),
    ).toBeVisible();
    await expect(
        page.locator('[data-slot="card"]').filter({ hasText: comments }),
    ).toContainText('Q1');

    await page.screenshot({
        path: 'verification/test-84-quincena/02-quincena-q1-accepted.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});

test('users can unset and reassign the account on a transaction', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const category = await getCategoryByCode(request, 'C001');
    const comments = 'unset-transaction-account';
    const account = await createAccount(request, 'Unset Account Checking');

    const created = await createTransaction(request, {
        date: '2026-01-29',
        period: '202601',
        quincena: 'Q1',
        category_id: category.id,
        account_id: account.id,
        amount_cad: 42,
        comments,
    });

    await openTransactionsPage(page);

    const transactionCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: comments });

    await expect(
        transactionCard.getByTestId(`transaction-account-${created.id}`),
    ).toContainText(account.name);

    await transactionCard.getByTestId('edit-transaction-button').click();
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible();
    await expect(page.getByTestId('account-field')).toContainText(account.name);

    await selectOption(page, 'Account', 'None');
    await submitTransactionForm(page, 'Update');

    await expect(
        transactionCard.getByTestId(`transaction-account-${created.id}`),
    ).toHaveText(/Account:\s*—/);

    const cleared = await getTransactionByComments(request, comments);
    expect(cleared.account_id).toBeNull();

    await transactionCard.getByTestId('edit-transaction-button').click();
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible();
    await expect(page.getByTestId('account-field')).toContainText('None');

    await selectOption(page, 'Account', account.name);
    await submitTransactionForm(page, 'Update');

    await expect(
        transactionCard.getByTestId(`transaction-account-${created.id}`),
    ).toContainText(account.name);

    const reassigned = await getTransactionByComments(request, comments);
    expect(reassigned.account_id).toBe(account.id);

    expect(consoleErrors).toEqual([]);
});
