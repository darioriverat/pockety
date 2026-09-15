import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 96: Exchange rate form validates that rates are positive numbers', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Step 1: Navigate to exchange rates form
    await page.goto('/exchange-rates');
    await expect(page.getByRole('heading', { name: 'Exchange Rates' })).toBeVisible();
    await expect(page.getByText('Set Exchange Rates')).toBeVisible();

    // Select a period first
    const periodSelector = page.getByTestId('page-period-selector');
    await periodSelector.click();
    await page.getByRole('option', { name: /January 2026/i }).click();

    // Wait for form to be ready
    await expect(page.getByLabel(/USD\/COP/i)).toBeVisible();

    // Step 2: Enter negative rate
    await page.getByLabel(/USD\/COP/).clear();
    await page.getByLabel(/USD\/COP/).fill('-4400');

    await page.getByRole('button', { name: /Save Exchange Rates/i }).click();

    // Step 3: Verify validation error is shown
    await expect(
        page.getByText(/must be a positive number/i)
    ).toBeVisible();

    // Error should remain visible
    await expect(page.getByText(/must be a positive number/i)).toBeVisible();

    // Step 4: Enter zero rate (also invalid)
    await page.getByLabel(/USD\/CAD/).clear();
    await page.getByLabel(/USD\/CAD/).fill('0');

    await page.getByRole('button', { name: /Save Exchange Rates/i }).click();

    // Verify zero is also rejected
    await expect(
        page.getByText(/must be a positive number/i)
    ).toBeVisible();

    // Step 5: Enter positive rates
    await page.getByLabel(/USD\/COP/).clear();
    await page.getByLabel(/USD\/COP/).fill('4400');

    await page.getByLabel(/USD\/CAD/).clear();
    await page.getByLabel(/USD\/CAD/).fill('0.75');

    await page.getByLabel(/CAD\/COP/).clear();
    await page.getByLabel(/CAD\/COP/).fill('3000');

    await page.getByRole('button', { name: /Save Exchange Rates/i }).click();

    // Step 6: Verify form accepts positive rates
    await expect(
        page.getByText(/Exchange rates saved successfully/i)
    ).toBeVisible();

    // Verify no error messages
    await expect(page.getByText(/must be a positive number/i)).not.toBeVisible();

    expect(consoleErrors).toEqual([]);
});
