import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'session-64',
);

test.beforeAll(() => {
    resetBrowserState();
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 113: user can toggle between Spanish and English category names', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Step 1: Navigate to categories page
    await page.goto('/categories');
    await expect(
        page.getByRole('heading', { name: 'Expense Categories' }),
    ).toBeVisible();

    // Step 2: Verify language toggle is available
    await expect(page.getByTestId('category-language-toggle')).toBeVisible();
    await page.screenshot({
        path: path.join(verificationDir, '01-categories-language-toggle.png'),
        fullPage: true,
    });

    // Step 3-4: Switch to Spanish and verify Spanish names
    await page.getByTestId('category-language-toggle-es').click();
    await expect(page.getByTestId('category-language-toggle-es')).toHaveAttribute(
        'data-state',
        'on',
    );
    await expect(page.getByTestId('category-name-C001')).toContainText('MERCADO');
    await expect(page.getByTestId('category-name-C001')).not.toContainText(
        'Groceries',
    );
    await page.screenshot({
        path: path.join(verificationDir, '02-categories-spanish.png'),
        fullPage: true,
    });

    // Step 5-6: Switch to English and verify English names
    await page.getByTestId('category-language-toggle-en').click();
    await expect(page.getByTestId('category-language-toggle-en')).toHaveAttribute(
        'data-state',
        'on',
    );
    await expect(page.getByTestId('category-name-C001')).toContainText(
        'Groceries',
    );
    await expect(page.getByTestId('category-name-C001')).not.toContainText(
        'MERCADO',
    );
    await page.screenshot({
        path: path.join(verificationDir, '03-categories-english.png'),
        fullPage: true,
    });

    // Also verify toggle on transactions page
    await page.goto('/transactions');
    await expect(page.getByTestId('category-language-toggle')).toBeVisible();
    await page.getByTestId('category-language-toggle-es').click();
    await expect(page.getByTestId('category-language-toggle-es')).toHaveAttribute(
        'data-state',
        'on',
    );
    await page.screenshot({
        path: path.join(verificationDir, '04-transactions-spanish-toggle.png'),
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
