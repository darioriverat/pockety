import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const PERIOD = '202601';
const SHOT_DIR = 'verification/reconciliation-inactive-inclusion';

async function createCategory(
    page: Page,
    name: string,
    kind: 'expense' | 'debt' | 'income',
): Promise<void> {
    await page.getByTestId('create-category-button').click();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByTestId(`kind-${kind}`).click();
    await page.getByTestId('create-category-submit').click();
    await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
}

async function addTransaction(
    page: Page,
    values: {
        code: string;
        amount: string;
        comments: string;
        debtComponent?: 'principal' | 'interest';
    },
): Promise<void> {
    await page
        .getByRole('button', { name: 'Add Transaction', exact: true })
        .click();
    await page
        .getByTestId('transaction-date')
        .locator('input')
        .fill('2026-01-15');
    await page.getByTestId('transaction-date').locator('input').press('Tab');
    await page.getByTestId('transaction-period-input').fill(PERIOD);
    await page.getByTestId('transaction-category-field').click();
    await page
        .getByRole('option', { name: new RegExp(`^${values.code} -`) })
        .click();
    await page.getByTestId('transaction-amount-input').fill(values.amount);
    await page.getByLabel('Comments').fill(values.comments);

    if (values.debtComponent) {
        await page
            .getByTestId('transaction-form-dialog')
            .getByTestId('debt-component-select')
            .selectOption(values.debtComponent);
    }

    const saved = page.waitForResponse(
        (r) =>
            r.request().method() === 'POST' &&
            r.url().endsWith('/api/transactions'),
    );
    await page.getByTestId('transaction-form-submit').click();
    expect((await saved).status()).toBe(201);
    await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);
}

async function loadReconciliation(page: Page): Promise<void> {
    await page.goto('/reconciliation');
    await expect(
        page.getByRole('heading', { name: 'Reconciliation' }),
    ).toBeVisible();
    await page.getByLabel('Period (YYYYMM)').fill(PERIOD);
    await page.getByRole('button', { name: 'View Reconciliation' }).click();
    await expect(page.getByTestId('accounting-equation-card')).toBeVisible();
}

test.beforeEach(() => {
    resetBrowserState();
    mkdirSync(SHOT_DIR, { recursive: true });
});

test('reconciliation totals include inactive expense and debt categories', async ({
    page,
}) => {
    test.setTimeout(90_000);
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);

    // Create expense + debt categories used in this period.
    await page.goto('/categories');
    await createCategory(page, 'Recon Inactive Expense', 'expense');
    await createCategory(page, 'Recon Inactive Debt', 'debt');
    await page.getByTestId('category-card-C047').scrollIntoViewIfNeeded();
    await page.getByTestId('category-card-C048').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/01-categories-created.png`,
    });

    // Transactions first so 202601 enters availablePeriods for the income page.
    await page.goto('/transactions');
    await addTransaction(page, {
        code: 'C047',
        amount: '200',
        comments: 'inactive-expense-recon',
    });
    await addTransaction(page, {
        code: 'C048',
        amount: '500',
        comments: 'inactive-debt-principal',
        debtComponent: 'principal',
    });
    await addTransaction(page, {
        code: 'C048',
        amount: '50',
        comments: 'inactive-debt-interest',
        debtComponent: 'interest',
    });
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/02-transactions.png`,
    });

    // Income line for 202601 (income_total_cad comes from income records).
    await page.goto('/income');
    await page
        .getByRole('textbox', { name: 'Period', exact: true })
        .fill(PERIOD);
    await page.getByRole('button', { name: 'Load Period' }).click();
    await expect(
        page.getByText('Total income (CAD equivalent) — January 2026'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Add Income' }).click();
    await page.getByLabel('Description').fill('Recon inactive income');
    await page.getByLabel('Amount CAD').fill('1000');
    await page.getByRole('button', { name: 'Save Income' }).click();
    await expect(page.getByText('Recon inactive income')).toBeVisible();
    await expect(page.getByTestId('income-total-cad')).toContainText('1,000');
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/03-income.png`,
    });

    // Baseline reconciliation totals before inactivation.
    await loadReconciliation(page);
    await expect(page.getByTestId('income-total')).toHaveText('$1,000.00');
    await expect(page.getByTestId('expenses-total')).toHaveText('$750.00');
    await expect(page.getByTestId('net-expenses')).toHaveText('$250.00');
    await expect(page.getByTestId('records-check-interest')).toContainText(
        '50.00',
    );
    await expect(page.getByTestId('records-check-debt-payments')).toContainText(
        '550.00',
    );
    await page.getByTestId('records-check-card').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/04-baseline-reconciliation.png`,
    });

    // Inactivate both categories that have transactions in the period.
    await page.goto('/categories');
    for (const code of ['C047', 'C048']) {
        await page.getByTestId(`edit-category-${code}`).click();
        await page.getByTestId('edit-category-active').uncheck();
        await page.getByTestId('edit-category-submit').click();
        await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    }
    await page.getByTestId('category-card-C047').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/05-categories-inactivated.png`,
    });

    // Totals must be unchanged after inactivation (#24 / #25).
    await loadReconciliation(page);
    await expect(page.getByTestId('income-total')).toHaveText('$1,000.00');
    await expect(page.getByTestId('expenses-total')).toHaveText('$750.00');
    await expect(page.getByTestId('net-expenses')).toHaveText('$250.00');
    await expect(page.getByTestId('records-check-interest')).toContainText(
        '50.00',
    );
    await expect(page.getByTestId('records-check-debt-payments')).toContainText(
        '550.00',
    );
    await expect(
        page.getByTestId('records-check-net-operating-expenses'),
    ).toContainText('250.00');
    await page.getByTestId('records-check-card').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/06-after-inactivation.png`,
    });

    expect(errors).toEqual([]);
});
