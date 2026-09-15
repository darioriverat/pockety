/**
 * Visual verification: period selector on financial-summary → February → transactions.
 * Run from repo root (or /var/www/vhosts in container):
 *   PLAYWRIGHT_BASE_URL=http://dev.pockety.com:8080 node verification/capture-period-selector.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';

mkdirSync(outDir, { recursive: true });

async function login(page) {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard$/);
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    await login(page);

    await page.goto(`${baseURL}/financial-summary`);
    await page.getByRole('heading', { name: 'Financial Summary' }).waitFor();
    const selector = page.getByTestId('period-selector');
    await selector.waitFor();

    // Prefer January 2025 if available so the change is visible
    const current = await selector.textContent();
    if (!current?.includes('January 2025')) {
        await selector.click();
        const jan = page.getByRole('option', { name: 'January 2025', exact: true });
        if (await jan.count()) {
            await jan.click();
            await page.waitForTimeout(500);
        } else {
            await page.keyboard.press('Escape');
        }
    }

    await page.screenshot({
        path: join(outDir, 'period-selector-01-financial-summary.png'),
        fullPage: false,
    });
    console.log('Saved period-selector-01-financial-summary.png');

    await selector.click();
    await page.getByRole('option', { name: 'February 2025', exact: true }).click();
    await selector.filter({ hasText: 'February 2025' }).waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({
        path: join(outDir, 'period-selector-02-february.png'),
        fullPage: false,
    });
    console.log('Saved period-selector-02-february.png');

    await page.goto(`${baseURL}/transactions`);
    await page.getByRole('heading', { name: 'Transactions' }).waitFor();
    await page.getByTestId('period-selector').filter({ hasText: 'February 2025' }).waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({
        path: join(outDir, 'period-selector-03-transactions-persisted.png'),
        fullPage: false,
    });
    console.log('Saved period-selector-03-transactions-persisted.png');

    await browser.close();
    console.log('Done.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
