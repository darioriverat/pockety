import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';
import {
    type ApiTransaction,
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function createAccount(
    request: APIRequestContext,
    name: string,
    type: 'bank' | 'liability',
): Promise<{ id: number; name: string }> {
    const response = await request.post('/api/accounts', {
        data: {
            name,
            type,
            primary_currency: 'CAD',
        },
    });
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
        data: { id: number; name: string };
    };

    return body.data;
}

async function openTransactionsPage(page: Page): Promise<void> {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(
        page.getByRole('heading', { name: 'Transactions' }),
    ).toBeVisible();
}

async function openAddTransactionDialog(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(
        page.getByRole('heading', { name: 'Add Transaction' }),
    ).toBeVisible();
}

async function selectAccount(page: Page, name: string): Promise<void> {
    const dialog = page.getByTestId('transaction-form-dialog');
    const trigger = dialog.getByRole('combobox', { name: 'Account' });
    await trigger.click();
    await page.getByRole('option', { name, exact: true }).click();
    await expect(trigger).toContainText(name);
}

async function getTransactionByComments(
    request: APIRequestContext,
    comments: string,
): Promise<ApiTransaction> {
    const response = await request.get('/api/transactions');
    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as { data: ApiTransaction[] };
    const transaction = payload.data.find((item) => item.comments === comments);

    if (!transaction) {
        throw new Error(
            `Transaction with comments "${comments}" was not found.`,
        );
    }

    return transaction;
}

test.beforeEach(async ({ page, request }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page, request);
});

test('credit checkbox stays hidden until an asset account is selected', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const asset = await createAccount(request, 'RBC Checking', 'bank');
    const liability = await createAccount(request, 'Visa', 'liability');

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    const dialog = page.getByTestId('transaction-form-dialog');
    await expect(dialog.getByLabel('Credit (refund / deposit)')).toHaveCount(0);

    await selectAccount(page, liability.name);
    await expect(dialog.getByLabel('Credit (refund / deposit)')).toHaveCount(0);

    await selectAccount(page, asset.name);
    await expect(dialog.getByLabel('Credit (refund / deposit)')).toBeVisible();

    expect(consoleErrors).toEqual([]);
});

test('user can record a credit only after choosing an asset account', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `credit-asset-${Date.now()}`;
    const asset = await createAccount(request, 'Credit Asset Checking', 'bank');

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    const dialog = page.getByTestId('transaction-form-dialog');
    await dialog.getByTestId('transaction-date-input').fill('2026-01-23');
    await dialog.getByTestId('transaction-period-input').fill('202601');
    await dialog.getByRole('combobox', { name: 'Category' }).click();
    await page
        .getByRole('option', { name: 'C001 - Groceries', exact: true })
        .click();
    await selectAccount(page, asset.name);
    await dialog.getByRole('combobox', { name: 'Currency' }).click();
    await page.getByRole('option', { name: 'CAD', exact: true }).click();
    await dialog.getByTestId('transaction-amount-input').fill('25.00');
    await dialog.getByLabel('Comments').fill(comments);
    await dialog.getByLabel('Credit (refund / deposit)').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toHaveCount(0);

    const transaction = await getTransactionByComments(request, comments);
    expect(transaction.is_credit).toBe(true);
    expect(transaction.account_id).toBe(asset.id);

    expect(consoleErrors).toEqual([]);
});

test('switching a checked credit to a liability clears the flag', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const comments = `credit-cleared-${Date.now()}`;
    const asset = await createAccount(request, 'Refund Checking', 'bank');
    const liability = await createAccount(request, 'Store Card', 'liability');

    await openTransactionsPage(page);
    await openAddTransactionDialog(page);

    const dialog = page.getByTestId('transaction-form-dialog');
    await dialog.getByTestId('transaction-date-input').fill('2026-01-24');
    await dialog.getByTestId('transaction-period-input').fill('202601');
    await dialog.getByRole('combobox', { name: 'Category' }).click();
    await page
        .getByRole('option', { name: 'C001 - Groceries', exact: true })
        .click();
    await selectAccount(page, asset.name);
    await dialog.getByLabel('Credit (refund / deposit)').click();
    await expect(dialog.getByLabel('Credit (refund / deposit)')).toBeChecked();

    await selectAccount(page, liability.name);
    await expect(dialog.getByLabel('Credit (refund / deposit)')).toHaveCount(0);

    await dialog.getByRole('combobox', { name: 'Currency' }).click();
    await page.getByRole('option', { name: 'CAD', exact: true }).click();
    await dialog.getByTestId('transaction-amount-input').fill('18.00');
    await dialog.getByLabel('Comments').fill(comments);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toHaveCount(0);

    const transaction = await getTransactionByComments(request, comments);
    expect(transaction.is_credit).toBe(false);
    expect(transaction.account_id).toBe(liability.id);

    expect(consoleErrors).toEqual([]);
});
