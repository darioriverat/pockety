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
    await page.goto('/settings/appearance');
    await expect(page).toHaveURL(/\/settings\/appearance$/);

    // Take screenshot of settings navigation
    await page.screenshot({
        path: 'verification/test-175-dark-mode/03-settings-page.png',
        fullPage: true,
    });

    // Verify appearance toggle is visible
    const lightButton = page.getByRole('button', { name: /^light$/i });
    const darkButton = page.getByRole('button', { name: /^dark$/i });
    const systemButton = page.getByRole('button', { name: /^system$/i });

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
    await page.getByRole('button', { name: /^light$/i }).click();
    await page.waitForTimeout(500);

    await expect(html).not.toHaveClass(/dark/);

    await page.screenshot({
        path: 'verification/test-175-dark-mode/07-back-to-light.png',
        fullPage: true,
    });

    // Test system preference mode
    await page.getByRole('button', { name: /^system$/i }).click();
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

        // Verify readable contrast using relative luminance (supports oklch/rgb)
        const contrast = await page.locator('body').evaluate((el) => {
            const parseColor = (value: string) => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return { r: 0, g: 0, b: 0 };
                }
                ctx.fillStyle = value;
                ctx.fillRect(0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                return { r, g, b };
            };

            const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
                const toLinear = (c: number) => {
                    const s = c / 255;
                    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
                };
                return (
                    0.2126 * toLinear(r) +
                    0.7152 * toLinear(g) +
                    0.0722 * toLinear(b)
                );
            };

            const computed = window.getComputedStyle(el);
            const text = parseColor(computed.color);
            const bg = parseColor(computed.backgroundColor);
            return {
                textLuminance: luminance(text),
                bgLuminance: luminance(bg),
            };
        });

        expect(contrast.textLuminance).toBeGreaterThan(0.6);
        expect(contrast.bgLuminance).toBeLessThan(0.2);
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

    // Verify form inputs are visible and readable (scoped to dialog)
    const dialog = page.getByRole('dialog');
    const amountInput = dialog.getByTestId('transaction-amount-input');
    await expect(amountInput).toBeVisible();

    // Verify primary action and close control are visible with good contrast
    const saveButton = dialog.getByTestId('transaction-form-submit');
    const closeButton = dialog.getByRole('button', { name: /close/i });

    await expect(saveButton).toBeVisible();
    await expect(closeButton).toBeVisible();

    // Test hover state on save button
    await saveButton.hover();
    await page.waitForTimeout(200);

    await page.screenshot({
        path: 'verification/test-175-dark-mode/12-button-hover-dark.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
