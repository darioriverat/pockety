import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Feature #117 — required field validation on transaction form.
 * Single login to avoid Fortify login throttle (5/min).
 */
test('required field validation on transaction form', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await page.goto('/transactions');
    await expect(page.getByTestId('transactions-heading')).toBeVisible();

    await page.getByRole('button', { name: /add transaction/i }).click();
    await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();

    // Multiple required fields empty
    await page.getByTestId('transaction-date-input').fill('');
    await page.getByTestId('transaction-period-input').fill('');
    await page.getByTestId('transaction-form-submit').click();

    await expect(page.getByTestId('date-error')).toHaveText('Date is required');
    await expect(page.getByTestId('period-error')).toHaveText(
        'Period is required',
    );
    await expect(page.getByTestId('category-error')).toHaveText(
        'Category is required',
    );
    await expect(page.getByTestId('amount-error')).toHaveText(
        'Amount is required',
    );
    await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-117-required-fields/01-multiple-errors.png',
        fullPage: true,
    });

    // Clearing date error by filling the field also clears period via auto-fill
    await page.getByTestId('transaction-date-input').fill('2025-01-15');
    await expect(page.getByTestId('date-error')).toHaveCount(0);
    await expect(page.getByTestId('period-error')).toHaveCount(0);
    await expect(page.getByTestId('transaction-period-input')).toHaveValue(
        '202501',
    );

    await page.screenshot({
        path: 'verification/test-117-required-fields/02-date-error-cleared.png',
        fullPage: true,
    });

    // Period-only error
    await page.getByTestId('transaction-period-input').fill('');
    await page.getByTestId('transaction-form-submit').click();
    await expect(page.getByTestId('period-error')).toHaveText(
        'Period is required',
    );

    await page.screenshot({
        path: 'verification/test-117-required-fields/03-period-error.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
