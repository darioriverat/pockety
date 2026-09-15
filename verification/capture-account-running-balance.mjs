/**
 * Visual + API verification for test #90: account running balance.
 *
 * Run from repo root:
 *   node verification/capture-account-running-balance.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'test-90-running-balance');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';

mkdirSync(outDir, { recursive: true });

async function api(path, options = {}) {
    const response = await fetch(`${baseURL}${path}`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });
    const text = await response.text();
    let body = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }
    if (!response.ok) {
        throw new Error(`${options.method || 'GET'} ${path} → ${response.status}: ${text}`);
    }
    return body;
}

async function login(page) {
    await page.goto(`${baseURL}/dev/login-as-test-user?redirect=/accounts`);
    await page.waitForURL(/\/accounts/);
}

async function main() {
    // Seed categories if empty
    const categories = await api('/api/categories');
    let categoryId = categories.data?.[0]?.id;
    if (!categoryId) {
        throw new Error('No categories available — seed BrowserTestSeeder first');
    }
    const c001 = categories.data.find((c) => c.code === 'C001');
    if (c001) categoryId = c001.id;

    const account = (
        await api('/api/accounts', {
            method: 'POST',
            body: JSON.stringify({
                name: `RB Verify ${Date.now()}`,
                type: 'bank',
                primary_currency: 'CAD',
            }),
        })
    ).data;

    await api(`/api/accounts/${account.id}/balances`, {
        method: 'POST',
        body: JSON.stringify({
            period: '202501',
            recorded_balance_cad: 700,
            recorded_balance_usd: 0,
            recorded_balance_cop: 0,
        }),
    });

    await api('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 100,
            comments: 'rb-verify-first',
        }),
    });

    await api('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: categoryId,
            account_id: account.id,
            amount_cad: 200,
            comments: 'rb-verify-second',
        }),
    });

    const txApi = await api(`/api/accounts/${account.id}/transactions`);
    const apiReport = {
        account_id: account.id,
        starting_balance: txApi.meta.starting_balance,
        current_balance: txApi.meta.current_balance,
        newest_running: txApi.data[0]?.running_balance,
        oldest_running: txApi.data[1]?.running_balance,
        newest_comments: txApi.data[0]?.comments,
        ok:
            txApi.meta.starting_balance === 1000 &&
            txApi.meta.current_balance === 700 &&
            txApi.data[0]?.running_balance === 700 &&
            txApi.data[1]?.running_balance === 900,
    };
    writeFileSync(join(outDir, 'api-verification.json'), JSON.stringify(apiReport, null, 2));
    console.log('API report:', JSON.stringify(apiReport, null, 2));
    if (!apiReport.ok) {
        throw new Error('API running balance verification failed');
    }

    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    if (process.env.CHROME_PATH) {
        launchOptions.executablePath = process.env.CHROME_PATH;
    }

    const browser = await chromium.launch(launchOptions);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await login(page);
    await page.goto(`${baseURL}/accounts/${account.id}`);
    await page.getByTestId('account-detail-page').waitFor({ timeout: 15000 });
    await page.getByTestId('starting-balance').waitFor();

    const startingText = await page.getByTestId('starting-balance').textContent();
    const currentText = await page.getByTestId('current-balance').textContent();
    const finalText = await page.getByTestId('final-running-balance').textContent();

    await page.screenshot({
        path: join(outDir, '01-account-running-balance.png'),
        fullPage: true,
    });
    console.log('Saved 01-account-running-balance.png');

    await page.getByTestId('account-transactions-table').screenshot({
        path: join(outDir, '02-transactions-table.png'),
    });
    console.log('Saved 02-transactions-table.png');

    const uiReport = {
        startingText,
        currentText,
        finalText,
        hasStarting1000: startingText?.includes('1,000.00') ?? false,
        hasCurrent700: currentText?.includes('700.00') ?? false,
        hasFinal700: finalText?.includes('700.00') ?? false,
        consoleErrors,
    };
    writeFileSync(join(outDir, 'ui-verification.json'), JSON.stringify(uiReport, null, 2));
    console.log('UI report:', JSON.stringify(uiReport, null, 2));

    await browser.close();

    if (!uiReport.hasStarting1000 || !uiReport.hasCurrent700 || !uiReport.hasFinal700) {
        throw new Error('UI running balance verification failed');
    }
    if (uiReport.consoleErrors.length) {
        throw new Error(`Console errors: ${uiReport.consoleErrors.join('; ')}`);
    }

    console.log('Test #90 verification PASSED');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
