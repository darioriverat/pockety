import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 175: application respects system dark mode preference', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Test light mode (default)
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Verify light mode is applied
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Take screenshot in light mode
    await page.screenshot({
        path: 'verification/test-175-dark-mode/01-light-mode-dashboard.png',
        fullPage: false,
    });

    // Switch to dark mode via system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    // Verify dark mode is applied
    await expect(html).toHaveClass(/dark/);

    // Take screenshot in dark mode
    await page.screenshot({
        path: 'verification/test-175-dark-mode/02-dark-mode-dashboard.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 175: dark mode toggle in settings works correctly', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');

    // Navigate to appearance settings
    await page.getByTestId('sidebar-menu-button').click();
    await page.getByRole('link', { name: /settings/i }).first().click();
    await expect(page).toHaveURL(/\/settings\/profile$/);

    // Take screenshot of settings navigation
    await page.screenshot({
        path: 'verification/test-175-dark-mode/03-settings-page.png',
        fullPage: true,
    });

    // Click on Appearance link in settings sidebar
    await page.getByRole('link', { name: /appearance/i }).click();
    await expect(page).toHaveURL(/\/settings\/appearance$/);

    // Verify appearance toggle is visible
    const lightButton = page.getByRole('button', { name: /light/i });
    const darkButton = page.getByRole('button', { name: /dark/i });
    const systemButton = page.getByRole('button', { name: /system/i });

    await expect(lightButton).toBeVisible();
    await expect(darkButton).toBeVisible();
    await expect(systemButton).toBeVisible();

    // Take screenshot of appearance settings
    await page.screenshot({
        path: 'verification/test-175-dark-mode/04-appearance-settings-light.png',
        fullPage: true,
    });

    // Switch to dark mode
    await darkButton.click();
    await page.waitForTimeout(500); // Wait for theme to apply

    // Verify dark mode is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Take screenshot in dark mode
    await page.screenshot({
        path: 'verification/test-175-dark-mode/05-appearance-settings-dark.png',
        fullPage: true,
    });

    // Navigate to dashboard to verify theme persists
    await page.goto('/dashboard');
    await expect(html).toHaveClass(/dark/);

    await page.screenshot({
        path: 'verification/test-175-dark-mode/06-dark-mode-persists.png',
        fullPage: false,
    });

    // Switch back to light mode
    await page.goto('/settings/appearance');
    await lightButton.click();
    await page.waitForTimeout(500);

    await expect(html).not.toHaveClass(/dark/);

    await page.screenshot({
        path: 'verification/test-175-dark-mode/07-back-to-light.png',
        fullPage: true,
    });

    // Test system preference mode
    await systemButton.click();
    await page.waitForTimeout(500);

    // System mode should respect browser preference
    await page.screenshot({
        path: 'verification/test-175-dark-mode/08-system-mode.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 175: colors are inverted and readable in dark mode', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Test multiple pages in both light and dark mode
    const pagesToTest = [
        { path: '/dashboard', name: 'dashboard' },
        { path: '/transactions', name: 'transactions' },
        { path: '/categories', name: 'categories' },
        { path: '/balance-sheet', name: 'balance-sheet' },
    ];

    for (const pageInfo of pagesToTest) {
        // Light mode
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        await page.screenshot({
            path: `verification/test-175-dark-mode/09-${pageInfo.name}-light.png`,
            fullPage: false,
        });

        // Dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify dark mode is applied
        await expect(page.locator('html')).toHaveClass(/dark/);

        await page.screenshot({
            path: `verification/test-175-dark-mode/10-${pageInfo.name}-dark.png`,
            fullPage: false,
        });

        // Verify text is readable (body should have light text on dark background)
        const body = page.locator('body');
        const bodyStyles = await body.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
            };
        });

        // In dark mode, text should be light (rgb values > 200)
        // and background should be dark (rgb values < 50)
        const textMatch = bodyStyles.color.match(/\d+/g);
        const bgMatch = bodyStyles.backgroundColor.match(/\d+/g);

        if (textMatch && bgMatch) {
            const textR = parseInt(textMatch[0]);
            const bgR = parseInt(bgMatch[0]);

            // Verify there's good contrast (light text on dark bg)
            expect(textR).toBeGreaterThan(200); // Light text
            expect(bgR).toBeLessThan(50); // Dark background
        }
    }

    expect(consoleErrors).toEqual([]);
});

test('feature 175: dark mode works correctly on forms and interactive elements', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/transactions');

    // Click add transaction button
    const addButton = page.getByRole('button', { name: /add transaction/i });
    await addButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Take screenshot of form in dark mode
    await page.screenshot({
        path: 'verification/test-175-dark-mode/11-form-dark.png',
        fullPage: true,
    });

    // Verify form inputs are visible and readable
    const amountInput = page.getByLabel(/amount/i);
    await expect(amountInput).toBeVisible();

    // Verify buttons are visible with good contrast
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    const saveButton = page.getByRole('button', { name: /save|create/i });

    await expect(cancelButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    // Test hover state on save button
    await saveButton.hover();
    await page.waitForTimeout(200);

    await page.screenshot({
        path: 'verification/test-175-dark-mode/12-button-hover-dark.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
