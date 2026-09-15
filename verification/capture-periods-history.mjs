/**
 * Visual verification: periods history page (feature #85).
 * Run: PLAYWRIGHT_BASE_URL=http://dev.pockety.com:8080 node verification/capture-periods-history.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'test-85-periods-history');
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
    const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
    });

    await login(page);
    await page.goto(`${baseURL}/periods/history`);
    await page.getByTestId('periods-history-heading').waitFor();
    await page.getByTestId('periods-history-table').waitFor();

    const countText = await page.getByTestId('periods-history-count').textContent();
    if (countText?.trim() !== '21') {
        throw new Error(`Expected 21 periods, got: ${countText}`);
    }

    await page.screenshot({
        path: join(outDir, '01-periods-history-overview.png'),
        fullPage: false,
    });
    console.log('Saved 01-periods-history-overview.png');

    await page.evaluate(() => {
        document
            .querySelector('[data-testid="period-row-202609"]')
            ?.scrollIntoView({ block: 'center' });
    });
    await page.screenshot({
        path: join(outDir, '02-periods-history-bottom.png'),
        fullPage: false,
    });
    console.log('Saved 02-periods-history-bottom.png');

    await page.screenshot({
        path: join(outDir, '03-periods-history-full.png'),
        fullPage: true,
    });
    console.log('Saved 03-periods-history-full.png');

    await browser.close();
    console.log('Done. Feature #85 verified.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
