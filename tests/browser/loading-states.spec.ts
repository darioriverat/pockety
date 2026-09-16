import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-153-loading-states';

for (const theme of ['light', 'dark'] as const) {
    test(`transactions page shows skeleton loading then content in ${theme}`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page);

        let releaseTransactions: (() => void) | undefined;
        const gate = new Promise<void>((resolve) => {
            releaseTransactions = resolve;
        });

        await page.route('**/api/transactions**', async (route) => {
            await gate;
            await route.continue();
        });

        const navigation = page.goto('/transactions');

        const loading = page.getByTestId('transactions-loading-state');
        await expect(loading).toBeVisible({ timeout: 10000 });
        await expect(loading).toHaveAttribute(
            'data-loading-variant',
            'skeleton-rows',
        );
        await expect(loading).toHaveAttribute('role', 'status');
        await expect(
            page.getByTestId('loading-skeleton-row').first(),
        ).toBeVisible();

        const pulseCount = await loading.locator('.animate-pulse').count();
        expect(pulseCount).toBeGreaterThan(0);

        await page.screenshot({
            path: `${evidence}/${theme}-transactions-loading.png`,
            fullPage: true,
        });

        releaseTransactions?.();
        await navigation;

        await expect(loading).toHaveCount(0, { timeout: 15000 });
        await expect(
            page.getByTestId('transactions-total'),
        ).toBeVisible({ timeout: 15000 });

        await page.screenshot({
            path: `${evidence}/${theme}-transactions-loaded.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
}

test('accounts page shows skeleton cards while fetching', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);

    let releaseAccounts: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
        releaseAccounts = resolve;
    });

    await page.route('**/api/accounts**', async (route) => {
        // Avoid blocking nested balance/history calls after list loads;
        // hold only the primary list request path without trailing segments.
        const url = route.request().url();
        if (/\/api\/accounts(\?|$)/.test(url)) {
            await gate;
        }
        await route.continue();
    });

    const navigation = page.goto('/accounts');
    const loading = page.getByTestId('accounts-loading-state');
    await expect(loading).toBeVisible({ timeout: 10000 });
    await expect(loading).toHaveAttribute(
        'data-loading-variant',
        'skeleton-cards',
    );
    await expect(
        page.getByTestId('loading-skeleton-card').first(),
    ).toBeVisible();

    await page.screenshot({
        path: `${evidence}/accounts-loading.png`,
        fullPage: true,
    });

    releaseAccounts?.();
    await navigation;
    await expect(loading).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Accounts/i);
    expect(consoleErrors).toEqual([]);
});

test('balance sheet page shows spinner loading state', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);

    let releaseSheet: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
        releaseSheet = resolve;
    });

    await page.route('**/api/balance-sheet**', async (route) => {
        // Do not block PDF/export endpoints.
        if (route.request().url().includes('/export')) {
            await route.continue();
            return;
        }
        await gate;
        await route.continue();
    });

    await page.goto('/balance-sheet');
    await expect(page.locator('h1')).toContainText(/Balance Sheet/i);

    const loading = page.getByTestId('balance-sheet-loading-state');
    await expect(loading).toBeVisible({ timeout: 10000 });
    await expect(loading).toHaveAttribute('data-loading-variant', 'spinner');
    await expect(page.getByTestId('loading-spinner')).toBeVisible();

    await page.screenshot({
        path: `${evidence}/balance-sheet-spinner.png`,
        fullPage: true,
    });

    releaseSheet?.();
    await expect(loading).toHaveCount(0, { timeout: 15000 });
    expect(consoleErrors).toEqual([]);
});
