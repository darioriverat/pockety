#!/usr/bin/env node
/**
 * End-to-end verification for feature #8 (flag update without transactions).
 * Does not reset the database.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';
const channel = process.env.PLAYWRIGHT_CHANNEL || undefined;

async function main() {
    const browser = await chromium.launch({
        headless: true,
        channel,
    });
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('status of 4')) {
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard$/);

    const createResponse = await page.request.post(`${baseURL}/api/categories`, {
        data: {
            name: 'Session5 Flag Target',
            is_debt_category: false,
            is_income_category: false,
        },
    });
    if (createResponse.status() !== 201) {
        throw new Error(`Create failed: ${createResponse.status()}`);
    }
    const created = await createResponse.json();
    const code = created.data.code;
    if (created.data.is_debt_category !== false) {
        throw new Error('Expected new expense category to have is_debt_category false');
    }

    const txCheck = await page.request.get(
        `${baseURL}/api/categories/${code}/transactions`,
    );
    const txBody = await txCheck.json();
    if (!Array.isArray(txBody.data) || txBody.data.length !== 0) {
        throw new Error('Expected no transactions for new category');
    }

    await page.goto(`${baseURL}/categories`);
    await page.getByTestId(`category-name-${code}`).waitFor();
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-flags-before.png',
        fullPage: true,
    });

    await page.getByTestId(`edit-category-${code}`).click();
    await page.getByTestId('edit-category-dialog').waitFor();
    await page.getByTestId('edit-kind-debt').check();
    await page.screenshot({
        path: 'verification/category-edit-flags-dialog.png',
    });

    const updatedPromise = page.waitForResponse(
        (response) =>
            response.request().method() === 'PUT' &&
            response.url().includes(`/api/categories/${code}`),
    );
    await page.getByTestId('edit-category-submit').click();
    const updated = await updatedPromise;
    if (updated.status() !== 200) {
        throw new Error(`Update failed: ${updated.status()}`);
    }
    const payload = await updated.json();
    if (payload.data.is_debt_category !== true) {
        throw new Error(`Expected is_debt_category true, got ${payload.data.is_debt_category}`);
    }

    await page.getByTestId(`debt-badge-${code}`).waitFor();
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-flags-after.png',
        fullPage: true,
    });

    await browser.close();

    fs.writeFileSync(
        'verification/category-edit-flags-result.json',
        JSON.stringify({ ok: true, code, payload, consoleErrors }, null, 2),
    );
    console.log('OK', code);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
