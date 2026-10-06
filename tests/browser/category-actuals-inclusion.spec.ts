import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeEach(() => resetBrowserState());

test('category actuals follows monthly transactions, including retired categories', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);
    await page.goto('/categories');
    for (const name of ['Actuals Activity', 'Actuals No Activity']) {
        await page.getByTestId('create-category-button').click();
        await page.getByLabel('Name', { exact: true }).fill(name);
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
    }
    await page.getByTestId('category-card-C048').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: 'verification/category-actuals-inclusion/01-categories.png',
    });
    await page.goto('/transactions');
    for (const [code, amount] of [
        ['C047', '125.50'],
        ['C001', '20'],
    ]) {
        await page
            .getByRole('button', { name: 'Add Transaction', exact: true })
            .click();
        await page
            .getByTestId('transaction-date')
            .locator('input')
            .fill('2026-01-15');
        await page
            .getByTestId('transaction-date')
            .locator('input')
            .press('Tab');
        await page.getByTestId('transaction-period-input').fill('202601');
        await page.getByTestId('transaction-category-field').click();
        await page
            .getByRole('option', { name: new RegExp(`^${code} -`) })
            .click();
        await page.getByTestId('transaction-amount-input').fill(amount);
        await page.screenshot({
            animations: 'disabled',
            path: `verification/category-actuals-inclusion/02-transaction-${code}.png`,
        });
        const saved = page.waitForResponse(
            (r) =>
                r.request().method() === 'POST' &&
                r.url().endsWith('/api/transactions'),
        );
        await page.getByTestId('transaction-form-submit').click();
        expect((await saved).status()).toBe(201);
        await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(
            0,
        );
    }
    await page.goto('/category-actuals');
    await page.getByTestId('page-period-selector').click();
    await page
        .getByRole('option', { name: 'January 2026', exact: true })
        .click();
    await expect(page.getByTestId('category-actuals-refresh')).toBeEnabled();
    await expect(page.getByTestId('category-actuals-count')).toHaveText('2');
    const rows = page.locator('[data-testid^="category-actual-row-"]');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toHaveAttribute(
        'data-testid',
        'category-actual-row-C001',
    );
    await expect(rows.nth(1)).toHaveAttribute(
        'data-testid',
        'category-actual-row-C047',
    );
    await expect(page.getByTestId('category-actual-amount-C047')).toContainText(
        '125.50',
    );
    await expect(page.getByTestId('category-actual-tx-C047')).toHaveText('1');
    await expect(page.getByTestId('category-actual-row-C048')).toHaveCount(0);
    await page.screenshot({
        animations: 'disabled',
        path: 'verification/category-actuals-inclusion/03-monthly-report.png',
    });
    await page.goto('/categories');
    await page.getByTestId('edit-category-C047').click();
    await page.getByTestId('edit-category-active').uncheck();
    await page.getByTestId('edit-category-submit').click();
    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await page.getByTestId('category-card-C047').scrollIntoViewIfNeeded();
    await page.screenshot({
        animations: 'disabled',
        path: 'verification/category-actuals-inclusion/04-retired.png',
    });
    await page.goto('/category-actuals');
    await expect(page.getByTestId('category-actual-amount-C047')).toContainText(
        '125.50',
    );
    await expect(page.getByTestId('category-actuals-refresh')).toBeEnabled();
    await expect(page.getByTestId('category-actuals-count')).toHaveText('2');
    await page.screenshot({
        animations: 'disabled',
        path: 'verification/category-actuals-inclusion/05-retired-history.png',
    });
    await page.getByTestId('page-period-selector').click();
    await page
        .getByRole('option', { name: 'February 2026', exact: true })
        .click();
    await expect(page.getByTestId('category-actuals-count')).toHaveText('0');
    await expect(rows).toHaveCount(0);
    await page.screenshot({
        animations: 'disabled',
        path: 'verification/category-actuals-inclusion/06-empty-month.png',
    });
    expect(errors).toEqual([]);
});
