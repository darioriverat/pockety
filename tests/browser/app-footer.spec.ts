import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 173: footer contains useful links and app version information', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Scroll to bottom to see footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for footer to be visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Take screenshot of the bottom of the page including footer
    await page.screenshot({
        path: 'verification/test-173-footer/01-footer-full-page.png',
        fullPage: true,
    });

    // Verify footer is present with consistent styling
    await expect(footer).toHaveClass(/border-t/);
    await expect(footer).toHaveClass(/border-border/);

    // Verify footer includes app name and version
    await expect(footer.getByText(/Pockety/i)).toBeVisible();
    await expect(footer.getByText(/v1\.0\.0/i)).toBeVisible();

    // Verify copyright is present
    const currentYear = new Date().getFullYear();
    await expect(
        footer.getByText(new RegExp(`© ${currentYear}`, 'i')),
    ).toBeVisible();

    // Verify the removed repository/documentation links are gone
    await expect(footer.getByRole('link', { name: /repository/i })).toHaveCount(
        0,
    );
    await expect(
        footer.getByRole('link', { name: /documentation/i }),
    ).toHaveCount(0);
    await expect(footer.locator('a[href*="github.com"]')).toHaveCount(0);

    // Take close-up screenshot of footer
    await footer.screenshot({
        path: 'verification/test-173-footer/02-footer-closeup.png',
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 173: footer appears consistently across different pages', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Test footer on multiple pages
    const pagesToTest = [
        { path: '/dashboard', name: 'dashboard' },
        { path: '/transactions', name: 'transactions' },
        { path: '/categories', name: 'categories' },
        { path: '/accounts', name: 'accounts' },
    ];

    for (const pageInfo of pagesToTest) {
        await page.goto(pageInfo.path);
        await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight),
        );

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // Verify footer content is consistent and no removed links return
        await expect(footer.getByText(/Pockety/i)).toBeVisible();
        await expect(footer.getByText(/v1\.0\.0/i)).toBeVisible();
        await expect(
            footer.getByRole('link', { name: /repository/i }),
        ).toHaveCount(0);
        await expect(
            footer.getByRole('link', { name: /documentation/i }),
        ).toHaveCount(0);

        await footer.screenshot({
            path: `verification/test-173-footer/03-footer-${pageInfo.name}.png`,
        });
    }

    expect(consoleErrors).toEqual([]);
});
