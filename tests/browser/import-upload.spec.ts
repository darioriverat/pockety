import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    selectDisplayedPeriod,
    trackConsoleErrors,
} from './helpers';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const fixtures = {
    transactionsJson: path.join(
        dirname,
        '../fixtures/transactions_sample.json',
    ),
    transactionsCsv: path.join(dirname, '../fixtures/transactions_sample.csv'),
    monthSheetA: path.join(
        dirname,
        '../fixtures/month_sheets/202501_sample.json',
    ),
    monthSheetB: path.join(
        dirname,
        '../fixtures/month_sheets/202502_sample.json',
    ),
    balanceSheet: path.join(dirname, '../fixtures/balance_sheet_sample.json'),
};

test.beforeEach(() => {
    resetBrowserState();
});

async function openImportPage(page: Page) {
    await page.goto('/import');
    await expect(
        page.getByRole('heading', { name: 'Import Historical Data' }),
    ).toBeVisible();
}

test('import page shows empty file inputs and no personal filenames', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await openImportPage(page);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('gastos_ledger_2025_2026.json');
    expect(bodyText).not.toContain('estado_financiero_2025_2026.json');
    expect(bodyText).not.toMatch(/\bmonth_sheets\b/);

    const transactionInput = page.getByTestId('transaction-file-input');
    const accountInput = page.getByTestId('account-file-input');
    const balanceInput = page.getByTestId('balance-sheet-file-input');

    await expect(transactionInput).toBeVisible();
    await expect(accountInput).toBeVisible();
    await expect(balanceInput).toBeVisible();

    await expect(transactionInput).toHaveValue('');
    await expect(accountInput).toHaveValue('');
    await expect(balanceInput).toHaveValue('');

    await expect(transactionInput).toHaveAttribute('accept', /json/);
    await expect(transactionInput).toHaveAttribute('accept', /csv/);
    await expect(accountInput).toHaveAttribute('multiple', '');
    await expect(balanceInput).toHaveAttribute('accept', /json/);

    await page.screenshot({
        path: 'verification/import-upload/empty-inputs.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('empty submit is rejected in the browser before calling the API', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await openImportPage(page);

    const requests: string[] = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().includes('/import')) {
            requests.push(request.url());
        }
    });

    await page.getByTestId('import-transactions-button').click();
    await expect(page.getByTestId('transaction-import-error')).toContainText(
        'Please choose a .json or .csv file',
    );

    await page.getByTestId('import-accounts-button').click();
    await expect(page.getByTestId('account-import-error')).toContainText(
        'Please choose one or more .json month-sheet files',
    );

    await page.getByTestId('import-balance-sheet-button').click();
    await expect(page.getByTestId('balance-sheet-import-error')).toContainText(
        'Please choose a .json balance sheet file',
    );

    expect(requests).toEqual([]);
    expect(consoleErrors).toEqual([]);
});

test('transaction JSON upload creates owner rows and reports imported/skipped', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await openImportPage(page);

    let sawMultipart = false;
    page.on('request', (request) => {
        if (
            request.method() === 'POST' &&
            request.url().includes('/api/transactions/import')
        ) {
            const contentType = request.headers()['content-type'] ?? '';
            sawMultipart = contentType.includes('multipart/form-data');
            const postData = request.postData() ?? '';
            expect(postData).not.toContain('file_path');
            expect(postData).not.toContain('directory');
            expect(postData).not.toContain('plan/extracted');
        }
    });

    await page
        .getByTestId('transaction-file-input')
        .setInputFiles(fixtures.transactionsJson);
    await page.getByTestId('import-transactions-button').click();

    await expect(page.getByTestId('transaction-import-result')).toBeVisible({
        timeout: 15000,
    });
    await expect(page.getByTestId('transactions-imported')).toContainText(
        'Imported: 2',
    );
    await expect(page.getByTestId('transactions-skipped')).toContainText(
        'Skipped: 2',
    );
    expect(sawMultipart).toBeTruthy();

    await page.goto('/transactions');
    await selectDisplayedPeriod(page, 'January 2025');
    await expect(page.getByText('Synthetic groceries')).toBeVisible();
    await expect(page.getByText('Synthetic dining receipt')).toBeVisible();

    await page.screenshot({
        path: 'verification/import-upload/transactions-json.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('transaction CSV upload and accounts multi-file upload work end-to-end', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await openImportPage(page);

    await page
        .getByTestId('transaction-file-input')
        .setInputFiles(fixtures.transactionsCsv);
    await page.getByTestId('import-transactions-button').click();
    await expect(page.getByTestId('transactions-imported')).toContainText(
        'Imported: 2',
        { timeout: 15000 },
    );

    await page
        .getByTestId('account-file-input')
        .setInputFiles([fixtures.monthSheetA, fixtures.monthSheetB]);
    await page.getByTestId('import-accounts-button').click();
    await expect(page.getByTestId('account-import-result')).toBeVisible({
        timeout: 15000,
    });

    await page.goto('/accounts');
    await expect(page.getByText('RBC Checking').first()).toBeVisible();
    await expect(page.getByText('Bancolombia').first()).toBeVisible();

    await page.screenshot({
        path: 'verification/import-upload/accounts-after-upload.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('import remains reachable from navigation', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);

    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Import' }).first().click();
    await expect(page).toHaveURL(/\/import/);
    await expect(page.getByTestId('transaction-import-card')).toBeVisible();
    await expect(page.getByTestId('account-import-card')).toBeVisible();
    await expect(page.getByTestId('balance-sheet-import-card')).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
