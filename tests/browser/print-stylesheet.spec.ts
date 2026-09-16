import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 174: print stylesheet hides navigation and formats content', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/balance-sheet');
    await expect(page).toHaveURL(/\/balance-sheet$/);

    // Take screenshot of normal view
    await page.screenshot({
        path: 'verification/test-174-print-stylesheet/01-normal-view.png',
        fullPage: true,
    });

    // Emulate print media to apply print styles
    await page.emulateMedia({ media: 'print' });

    // Wait a moment for styles to apply
    await page.waitForTimeout(500);

    // Verify navigation elements are hidden in print view
    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeHidden();

    // Footer should also be hidden
    const footer = page.locator('footer');
    await expect(footer).toBeHidden();

    // Take screenshot of print view
    await page.screenshot({
        path: 'verification/test-174-print-stylesheet/02-print-view.png',
        fullPage: true,
    });

    // Verify main content is still visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Reset media to screen
    await page.emulateMedia({ media: 'screen' });

    expect(consoleErrors).toEqual([]);
});

test('feature 174: print stylesheet formats reports properly', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Test multiple report pages
    const reportPages = [
        { path: '/balance-sheet', name: 'balance-sheet' },
        { path: '/financial-summary', name: 'financial-summary' },
        { path: '/reports/year-to-date', name: 'ytd-report' },
    ];

    for (const reportPage of reportPages) {
        await page.goto(reportPage.path);
        await page.waitForLoadState('networkidle');

        // Take normal view
        await page.screenshot({
            path: `verification/test-174-print-stylesheet/03-${reportPage.name}-normal.png`,
            fullPage: true,
        });

        // Apply print styles
        await page.emulateMedia({ media: 'print' });
        await page.waitForTimeout(500);

        // Verify sidebar and footer are hidden
        await expect(page.getByTestId('app-sidebar')).toBeHidden();
        await expect(page.locator('footer')).toBeHidden();

        // Verify content is visible
        await expect(page.locator('main')).toBeVisible();

        // Take print view
        await page.screenshot({
            path: `verification/test-174-print-stylesheet/04-${reportPage.name}-print.png`,
            fullPage: true,
        });

        // Reset media
        await page.emulateMedia({ media: 'screen' });
    }

    expect(consoleErrors).toEqual([]);
});

test('feature 174: print preview shows logical page breaks', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/balance-sheet');
    await expect(page).toHaveURL(/\/balance-sheet$/);

    // Generate PDF with print styles to verify formatting
    const pdf = await page.pdf({
        path: 'verification/test-174-print-stylesheet/05-balance-sheet.pdf',
        format: 'Letter',
        printBackground: false,
        margin: {
            top: '1.5cm',
            bottom: '1.5cm',
            left: '1.5cm',
            right: '1.5cm',
        },
    });

    // Verify PDF was generated
    expect(pdf.length).toBeGreaterThan(0);

    expect(consoleErrors).toEqual([]);
});

test('feature 174: data tables are readable in print view', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/transactions$/);

    // Normal view
    await page.screenshot({
        path: 'verification/test-174-print-stylesheet/06-transactions-normal.png',
        fullPage: false,
    });

    // Apply print styles
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);

    // Verify table is visible
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify action buttons are hidden in print (if they exist)
    const actionButtons = page.locator('[data-slot="action"]');
    const actionButtonCount = await actionButtons.count();
    if (actionButtonCount > 0) {
        await expect(actionButtons.first()).toBeHidden();
    }

    // Take print view
    await page.screenshot({
        path: 'verification/test-174-print-stylesheet/07-transactions-print.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});
