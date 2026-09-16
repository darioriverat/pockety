import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const verificationDir = path.join(process.cwd(), 'verification', 'session-66');

test.beforeAll(() => {
    resetBrowserState();
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 115: user can generate PDF report of balance sheet for a period', async ({
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

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'RBC Checking PDF Export',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()).data;

    const loanResponse = await request.post('/api/accounts', {
        data: {
            name: 'Personal LOAN CIBC PDF',
            type: 'liability',
            primary_currency: 'CAD',
        },
    });
    expect(loanResponse.ok()).toBeTruthy();
    const loan = (await loanResponse.json()).data;

    await request.post(`/api/accounts/${bank.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 4500,
        },
    });
    await request.post(`/api/accounts/${loan.id}/balances`, {
        data: {
            period: '202501',
            recorded_balance_cad: 1200,
        },
    });

    // Step 1: Navigate to balance sheet for period 202501
    await page.goto('/balance-sheet?period=202501');
    await expect(
        page.getByRole('heading', { name: 'Balance Sheet' }),
    ).toBeVisible();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'January 2025',
    );
    await expect(page.getByTestId('total-assets-cad')).toBeVisible();
    await expect(page.getByTestId('export-balance-sheet-pdf')).toBeVisible();

    await page.screenshot({
        path: path.join(verificationDir, '01-balance-sheet-before-export.png'),
        fullPage: true,
    });

    // Step 2-3: Click Export to PDF and verify download
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-balance-sheet-pdf').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
        /^balance_sheet_202501_\d{4}-\d{2}-\d{2}\.pdf$/,
    );

    const pdfPath = path.join(verificationDir, 'balance-sheet-202501.pdf');
    await download.saveAs(pdfPath);
    expect(fs.existsSync(pdfPath)).toBeTruthy();

    // Step 4-5: Open PDF and verify assets, liabilities, equity formatting
    const pdfBytes = fs.readFileSync(pdfPath);
    expect(pdfBytes.subarray(0, 4).toString('utf8')).toBe('%PDF');
    const pdfText = pdfBytes.toString('latin1');
    expect(pdfText).toContain('Balance Sheet');
    expect(pdfText).toContain('Assets');
    expect(pdfText).toContain('Liabilities');
    expect(pdfText).toContain('Equity');
    expect(pdfText).toContain('Total Assets');
    expect(pdfText).toContain('Total Liabilities');
    expect(pdfText).toContain('RBC Checking PDF Export');
    expect(pdfText).toContain('Personal LOAN CIBC PDF');

    await page.screenshot({
        path: path.join(verificationDir, '02-balance-sheet-after-export.png'),
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
