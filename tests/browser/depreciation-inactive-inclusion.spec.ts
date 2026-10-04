import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const PERIOD = '202601';
const SHOT_DIR = 'verification/depreciation-inactive-inclusion';

test.beforeEach(() => {
    resetBrowserState();
    mkdirSync(SHOT_DIR, { recursive: true });
});

test('inactive C045 depreciation remains in financial summary', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);

    // Seed a C045 transaction while the category is still active.
    await page.goto('/transactions');
    await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
    await page.getByTestId('transaction-date').locator('input').fill('2026-01-20');
    await page.getByTestId('transaction-date').locator('input').press('Tab');
    await page.getByTestId('transaction-period-input').fill(PERIOD);
    await page.getByTestId('transaction-category-field').click();
    await page.getByRole('option', { name: /^C045 -/ }).click();
    await page.getByTestId('transaction-amount-input').fill('75');
    await page.getByLabel('Comments').fill('inactive-c045-depreciation');
    const saved = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/api/transactions'),
    );
    await page.getByTestId('transaction-form-submit').click();
    expect((await saved).status()).toBe(201);
    await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);

    await page.goto('/financial-summary');
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'January 2026', exact: true }).click();
    await expect(page.getByTestId('depreciation-excluded')).toContainText('75.00');
    await expect(page.getByTestId('summary-row-C045')).toBeVisible();
    await expect(page.getByTestId('total-C045')).toContainText('75.00');
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/01-active-c045.png`,
    });

    // Inactivate C045 and confirm depreciation math still includes it.
    await page.goto('/categories');
    await page.getByTestId('edit-category-C045').click();
    await page.getByTestId('edit-category-active').uncheck();
    await page.getByTestId('edit-category-submit').click();
    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/02-c045-inactivated.png`,
    });

    await page.goto('/financial-summary');
    await expect(page.getByTestId('depreciation-excluded')).toContainText('75.00');
    await expect(page.getByTestId('summary-row-C045')).toBeVisible();
    await expect(page.getByTestId('total-C045')).toContainText('75.00');
    await expect(page.getByTestId('total-recorded-disbursements')).toContainText(
        '75.00',
    );
    await expect(page.getByTestId('net-operating-expenses')).toContainText('0.00');
    await page.getByTestId('summary-row-C045').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: `${SHOT_DIR}/03-inactive-c045-included.png`,
    });

    expect(errors).toEqual([]);
});
