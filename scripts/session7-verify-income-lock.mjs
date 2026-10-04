#!/usr/bin/env node
/**
 * End-to-end verification for feature #10 (reject income flag change with transactions).
 * Prefer: node scripts/session-helpers.mjs browser category-edit-income-flag-locked.spec.ts
 */
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
            name: `Session7 Income Lock ${Date.now()}`,
            is_debt_category: false,
            is_income_category: false,
        },
    });
    if (createResponse.status() !== 201) {
        throw new Error(`Create failed: ${createResponse.status()}`);
    }
    const created = await createResponse.json();
    const { id, code } = created.data;

    const txResponse = await page.request.post(`${baseURL}/api/transactions`, {
        data: {
            date: '2026-01-15',
            period: '202601',
            category_id: id,
            amount_cad: 12.34,
            comments: 'session7 income lock',
        },
    });
    if (!txResponse.ok()) {
        throw new Error(`Transaction failed: ${txResponse.status()}`);
    }

    const putResponse = await page.request.put(`${baseURL}/api/categories/${code}`, {
        data: { is_income_category: true },
    });
    const putBody = await putResponse.json();
    if (putResponse.status() !== 422) {
        throw new Error(`Expected 422, got ${putResponse.status()}`);
    }
    const expected =
        'Debt and income settings cannot be changed because this category has transactions';
    if ((putBody.error ?? putBody.message) !== expected) {
        throw new Error(`Unexpected message: ${putBody.error ?? putBody.message}`);
    }

    await page.goto(`${baseURL}/categories`);
    await page.getByTestId(`edit-category-${code}`).click();
    await page.getByTestId('edit-kind-locked-message').waitFor();
    if (!(await page.getByTestId('edit-kind-income').isDisabled())) {
        throw new Error('Expected income kind radio to be disabled');
    }
    await page.screenshot({
        path: 'verification/category-edit-income-flag-locked-dialog.png',
    });

    await browser.close();

    if (consoleErrors.length) {
        throw new Error(`Console errors: ${consoleErrors.join('; ')}`);
    }
    console.log('OK', { code, status: putResponse.status(), message: expected });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
