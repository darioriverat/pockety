import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const verificationDir = path.join(process.cwd(), 'verification', 'session-65');

test.beforeAll(() => {
    resetBrowserState();
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 114: system auto-calculates period from transaction date', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Step 1: Navigate to add transaction form
    await page.goto('/transactions');
    await expect(
        page.getByRole('heading', { name: 'Transactions' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(page.getByTestId('transaction-form-title')).toHaveText(
        'Add Transaction',
    );
    await expect(page.getByTestId('transaction-period-hint')).toContainText(
        'Auto-filled from date',
    );

    // Step 2-3: Enter date 2025-01-15 and verify period is 202501
    await page.getByTestId('transaction-date-input').fill('2025-01-15');
    await expect(page.getByTestId('transaction-period-input')).toHaveValue(
        '202501',
    );
    await page.screenshot({
        path: path.join(verificationDir, '01-period-from-jan-date.png'),
        fullPage: true,
    });

    // Step 4-5: Change date to 2026-02-20 and verify period updates to 202602
    await page.getByTestId('transaction-date-input').fill('2026-02-20');
    await expect(page.getByTestId('transaction-period-input')).toHaveValue(
        '202602',
    );
    await page.screenshot({
        path: path.join(verificationDir, '02-period-from-feb-date.png'),
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
