import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-154-empty-states';

const emptyTransactionsPayload = {
    data: [],
    links: { self: '/api/transactions' },
    meta: { total: 0, page: 1, per_page: 50, last_page: 1 },
};

async function mockEmptyTransactions(page: import('@playwright/test').Page) {
    await page.route('**/api/transactions**', async (route) => {
        const url = route.request().url();
        // Let non-list calls (create/update) through if any.
        if (route.request().method() !== 'GET') {
            await route.continue();
            return;
        }
        if (!/\/api\/transactions(\?|$)/.test(url)) {
            await route.continue();
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(emptyTransactionsPayload),
        });
    });
}

for (const theme of ['light', 'dark'] as const) {
    test(`transactions empty state shows message, icon, and CTA in ${theme}`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page);
        await mockEmptyTransactions(page);

        await page.goto('/transactions');
        await expect(page.locator('h1')).toContainText(/Transactions/i);

        const empty = page.getByTestId('transactions-empty-state');
        await expect(empty).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('empty-state-title')).toHaveText(
            /No transactions yet/i,
        );
        await expect(page.getByTestId('empty-state-icon')).toBeVisible();
        await expect(page.getByTestId('empty-state-description')).toBeVisible();

        const cta = page.getByTestId('add-first-transaction');
        await expect(cta).toBeVisible();
        await expect(cta).toHaveText(/Add First Transaction/i);

        await page.screenshot({
            path: `${evidence}/${theme}-transactions-empty.png`,
            fullPage: true,
        });

        await cta.click();
        await expect(
            page.getByTestId('transaction-form-dialog'),
        ).toBeVisible();
        await expect(
            page.getByTestId('transaction-form-title'),
        ).toContainText(/Add Transaction/i);

        await page.screenshot({
            path: `${evidence}/${theme}-transactions-empty-cta-opens.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
}

test('accounts empty state shows helpful CTA', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);

    await page.route('**/api/accounts**', async (route) => {
        const url = route.request().url();
        if (
            route.request().method() === 'GET' &&
            /\/api\/accounts(\?|$)/.test(url)
        ) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: [], links: { self: '/api/accounts' } }),
            });
            return;
        }
        await route.continue();
    });

    await page.goto('/accounts');
    const empty = page.getByTestId('accounts-empty-state');
    await expect(empty).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('empty-state-title')).toHaveText(
        /No accounts yet/i,
    );
    await expect(page.getByTestId('add-first-account')).toBeVisible();
    await expect(page.getByTestId('empty-state-icon')).toBeVisible();

    await page.screenshot({
        path: `${evidence}/accounts-empty.png`,
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
