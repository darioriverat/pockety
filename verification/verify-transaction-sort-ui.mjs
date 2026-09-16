/**
 * UI verification for transaction sorting using Playwright + system Chrome.
 * Saves screenshots under verification/test-120|121|122-*.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';

function resetDb() {
    try {
        execFileSync(
            'php',
            [
                'artisan',
                'migrate:fresh',
                '--seed',
                '--seeder=BrowserTestSeeder',
                '--force',
            ],
            { stdio: 'inherit', cwd: process.cwd() },
        );
    } catch {
        console.warn(
            'php artisan reset unavailable on host; continuing with existing DB',
        );
    }
}

async function login(page) {
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard/);
}

async function createViaApi(page, data) {
    const result = await page.evaluate(async (payload) => {
        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(payload),
        });
        return { ok: res.ok, status: res.status, body: await res.text() };
    }, data);
    if (!result.ok) {
        throw new Error(`API create failed ${result.status}: ${result.body}`);
    }
}

async function openSeptember(page) {
    await page.goto(`${BASE}/transactions`);
    await page.getByRole('heading', { name: 'Transactions' }).waitFor();
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'September 2026', exact: true }).click();
}

async function main() {
    mkdirSync('verification/test-120-sort-date', { recursive: true });
    mkdirSync('verification/test-121-sort-amount', { recursive: true });
    mkdirSync('verification/test-122-sort-category', { recursive: true });

    resetDb();

    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('status of 4')) {
            consoleErrors.push(msg.text());
        }
    });

    await login(page);

    const categories = await page.evaluate(async () => {
        const res = await fetch('/api/categories');
        const json = await res.json();
        return json.data;
    });
    const groceries =
        categories.find((c) => c.name_en === 'Groceries') ?? categories[0];
    const transport =
        categories.find((c) => c.name_en === 'Transportation') ??
        categories[1];
    const utilities =
        categories.find((c) => c.name_en === 'Utilities') ?? categories[2];

    await createViaApi(page, {
        date: '2026-09-10',
        period: '202609',
        quincena: 'Q1',
        category_id: groceries.id,
        amount_cad: 10,
        comments: 'ui-sort-mid',
    });
    await createViaApi(page, {
        date: '2026-09-01',
        period: '202609',
        quincena: 'Q1',
        category_id: transport.id,
        amount_cad: 50,
        comments: 'ui-sort-early',
    });
    await createViaApi(page, {
        date: '2026-09-20',
        period: '202609',
        quincena: 'Q2',
        category_id: utilities.id,
        amount_cad: 25,
        comments: 'ui-sort-late',
    });

    await openSeptember(page);
    await page.getByTestId('sort-header-date').waitFor();

    // Date asc
    await page.getByTestId('sort-header-date').click();
    await page.waitForTimeout(400);
    await page.screenshot({
        path: 'verification/test-120-sort-date/01-date-ascending.png',
        fullPage: true,
    });
    const datesAsc = await page
        .locator('[data-testid^="transaction-date-"]')
        .allTextContents();
    const dateValuesAsc = datesAsc.map(
        (t) => t.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '',
    );
    if (
        JSON.stringify(dateValuesAsc) !==
        JSON.stringify(['2026-09-01', '2026-09-10', '2026-09-20'])
    ) {
        throw new Error(`date asc UI failed: ${JSON.stringify(dateValuesAsc)}`);
    }

    // Date desc
    await page.getByTestId('sort-header-date').click();
    await page.waitForTimeout(400);
    await page.screenshot({
        path: 'verification/test-120-sort-date/02-date-descending.png',
        fullPage: true,
    });

    // Amount
    await page.getByTestId('sort-header-amount').click();
    await page.waitForTimeout(400);
    await page.screenshot({
        path: 'verification/test-121-sort-amount/01-amount-ascending.png',
        fullPage: true,
    });
    const amountsAsc = (
        await page.locator('[data-testid^="transaction-amount-"]').allTextContents()
    ).map((t) => t.replace(/[^0-9.]/g, ''));
    if (JSON.stringify(amountsAsc) !== JSON.stringify(['10.00', '25.00', '50.00'])) {
        throw new Error(`amount asc UI failed: ${JSON.stringify(amountsAsc)}`);
    }

    await page.getByTestId('sort-header-amount').click();
    await page.waitForTimeout(400);
    await page.screenshot({
        path: 'verification/test-121-sort-amount/02-amount-descending.png',
        fullPage: true,
    });

    // Category
    await page.getByTestId('sort-header-category').click();
    await page.waitForTimeout(400);
    await page.screenshot({
        path: 'verification/test-122-sort-category/01-category-ascending.png',
        fullPage: true,
    });
    await page.getByTestId('sort-header-category').click();
    await page.waitForTimeout(400);
    await page.screenshot({
        path: 'verification/test-122-sort-category/02-category-descending.png',
        fullPage: true,
    });

    await browser.close();

    if (consoleErrors.length) {
        throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);
    }

    console.log('UI SORT VERIFICATION PASSED WITH SCREENSHOTS');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
