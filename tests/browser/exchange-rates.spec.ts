import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
    ensureTransactionInPeriod,
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'exchange-rates',
);
mkdirSync(verificationDir, { recursive: true });

test.beforeAll(() => {
    resetBrowserState();
});

test('exchange rates page uses manual snapshots and period assignment without legacy inputs', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page, request);
    await ensureTransactionInPeriod(page.request, '202501');

    await page.goto('/exchange-rates');
    await expect(
        page.getByRole('heading', { name: /Exchange Rates/i }),
    ).toBeVisible();
    await expect(page.getByTestId('oxr-attribution-link')).toHaveAttribute(
        'href',
        'https://openexchangerates.org/',
    );

    await expect(page.getByLabel(/USD\/COP/i)).toHaveCount(0);
    await expect(page.getByLabel(/USD\/CAD/i)).toHaveCount(0);
    await expect(page.getByLabel(/CAD\/COP/i)).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: /Import from Month Sheets/i }),
    ).toHaveCount(0);

    await page.getByTestId('manual-rate-date').fill('2025-01-31');
    await page.getByTestId('manual-cad-per-usd').fill('1.36');
    await page.getByTestId('manual-cop-per-usd').fill('4000');
    await page.getByTestId('save-manual-snapshot').click();
    await expect(
        page.getByText(/Manual snapshot saved successfully/i),
    ).toBeVisible();

    const periodSelector = page.getByTestId('page-period-selector');
    await periodSelector.click();
    await page.getByRole('option', { name: /January 2025/i }).click();

    await page.getByTestId('snapshot-picker').click();
    await page
        .getByRole('option', { name: /2025-01-31/i })
        .first()
        .click();
    await page.getByTestId('assign-snapshot').click();
    await expect(
        page.getByText(/Exchange rates saved successfully/i),
    ).toBeVisible();

    await expect(page.getByText(/Derived USD\/COP:\s*4000/i)).toBeVisible();
    await expect(page.getByRole('cell', { name: '4000.0000' })).toBeVisible();

    await page.screenshot({
        path: path.join(verificationDir, 'assigned-desktop.png'),
        fullPage: true,
        animations: 'disabled',
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
        path: path.join(verificationDir, 'assigned-mobile.png'),
        fullPage: true,
        animations: 'disabled',
    });

    expect(consoleErrors).toEqual([]);
});

test('exchange rates page shows missing-rate message before assignment', async ({
    page,
    request,
}) => {
    await loginAsBrowserTestUser(page, request);
    await ensureTransactionInPeriod(page.request, '202502');

    await page.goto('/exchange-rates');
    const periodSelector = page.getByTestId('page-period-selector');
    await periodSelector.click();
    await page.getByRole('option', { name: /February 2025/i }).click();

    await expect(page.getByTestId('missing-exchange-rate')).toBeVisible();
});
