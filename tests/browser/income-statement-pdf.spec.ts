import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
} from './helpers';

const verificationDir = path.join(process.cwd(), 'verification', 'session-67');

test.beforeAll(() => {
    resetBrowserState();
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 116: user can generate PDF report of income statement for a period', async ({
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

    await request.post('/api/income', {
        data: {
            period: '202501',
            description: 'Salary CAD PDF Export',
            line_number: 1,
            amount_cad: 4200,
        },
    });

    await request.post('/api/income', {
        data: {
            period: '202501',
            description: 'Side Project USD',
            line_number: 2,
            amount_usd: 300,
        },
    });

    const categoriesResponse = await request.get('/api/categories');
    const categoriesPayload = await categoriesResponse.json();
    const categories: ApiCategory[] = categoriesPayload.data;
    const c001 = categories.find((category) => category.code === 'C001');
    expect(c001).toBeTruthy();

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-12',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 180,
            comments: 'Groceries for income statement PDF',
        },
    });

    // Step 1: Navigate to income statement/summary for period 202501
    await page.goto('/financial-summary?period=202501');
    await expect(
        page.getByRole('heading', { name: 'Financial Summary' }),
    ).toBeVisible();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'January 2025',
    );
    await expect(page.getByTestId('export-income-statement-pdf')).toBeVisible();
    await expect(page.getByTestId('total-income')).toBeVisible();
    await expect(page.getByTestId('income-lines-table')).toBeVisible();
    await expect(page.getByTestId('financial-summary-table')).toBeVisible();
    await expect(page.getByTestId('income-statement-net')).toBeVisible();

    await page.screenshot({
        path: path.join(verificationDir, '01-income-statement-before-export.png'),
        fullPage: true,
    });

    // Step 2-3: Click Export to PDF and verify download
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-income-statement-pdf').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
        /^income_statement_202501_\d{4}-\d{2}-\d{2}\.pdf$/,
    );

    const pdfPath = path.join(verificationDir, 'income-statement-202501.pdf');
    await download.saveAs(pdfPath);
    expect(fs.existsSync(pdfPath)).toBeTruthy();

    // Step 4: Verify PDF shows income line items, total income, expenses by category, net
    const pdfBytes = fs.readFileSync(pdfPath);
    expect(pdfBytes.subarray(0, 4).toString('utf8')).toBe('%PDF');
    const pdfText = pdfBytes.toString('latin1');
    expect(pdfText).toContain('Income Statement');
    expect(pdfText).toContain('Income');
    expect(pdfText).toContain('Total Income');
    expect(pdfText).toContain('Expenses by Category');
    expect(pdfText).toContain('Net');
    expect(pdfText).toContain('Salary CAD PDF Export');
    expect(pdfText).toContain('Side Project USD');
    expect(pdfText).toContain('C001');
    expect(pdfText).toContain('MERCADO');
    expect(pdfText).toContain('Net Operating Expenses');

    await page.screenshot({
        path: path.join(verificationDir, '02-income-statement-after-export.png'),
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
