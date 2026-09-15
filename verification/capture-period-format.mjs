/**
 * Visual verification: transaction period YYYYMM validation (feature #83).
 * Run: PLAYWRIGHT_BASE_URL=http://dev.pockety.com:8080 node verification/capture-period-format.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'test-83-period-format');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';

mkdirSync(outDir, { recursive: true });

async function login(page) {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard$/);
}

async function selectByLabel(page, label, option) {
    const dialog = page.locator('[data-slot="dialog-content"]');
    await dialog
        .getByText(label, { exact: true })
        .locator('..')
        .getByRole('combobox')
        .first()
        .click();
    await page.getByRole('option', { name: option, exact: true }).click();
}

async function main() {
    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    if (process.env.CHROME_PATH || process.platform === 'darwin') {
        launchOptions.executablePath =
            process.env.CHROME_PATH ||
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }

    const browser = await chromium.launch(launchOptions);
    const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
    });

    await login(page);
    await page.goto(`${baseURL}/transactions`);
    await page.getByRole('heading', { name: 'Transactions' }).waitFor();

    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await page.getByRole('heading', { name: 'Add Transaction' }).waitFor();

    await page.getByLabel('Date').fill('2025-01-15');
    await page.getByLabel('Period (YYYYMM)').fill('2025-01');
    await selectByLabel(page, 'Quincena', 'Q1');
    await selectByLabel(page, 'Category', 'C001 - Groceries');
    await selectByLabel(page, 'Currency', 'CAD');
    await page.getByLabel('Amount').fill('42.00');
    await page.getByLabel('Comments').fill('verify-period-format-invalid');

    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByTestId('transaction-form-error').waitFor({ state: 'visible' });

    await page.screenshot({
        path: join(outDir, '01-invalid-period-2025-01.png'),
        fullPage: false,
    });
    console.log('Saved 01-invalid-period-2025-01.png');

    const errorText = await page.getByTestId('transaction-form-error').textContent();
    if (!errorText || !/YYYYMM/i.test(errorText)) {
        throw new Error(`Expected YYYYMM error, got: ${errorText}`);
    }

    await page.getByLabel('Period (YYYYMM)').fill('01/2025');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByTestId('transaction-form-error').waitFor({ state: 'visible' });
    await page.screenshot({
        path: join(outDir, '02-invalid-period-01-2025.png'),
        fullPage: false,
    });
    console.log('Saved 02-invalid-period-01-2025.png');

    await page.getByLabel('Period (YYYYMM)').fill('202501');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.locator('[data-slot="dialog-content"]').waitFor({ state: 'hidden' });
    await page.waitForTimeout(500);

    await page.screenshot({
        path: join(outDir, '03-valid-period-accepted.png'),
        fullPage: false,
    });
    console.log('Saved 03-valid-period-accepted.png');

    await browser.close();
    console.log('Done. Feature #83 verified.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
