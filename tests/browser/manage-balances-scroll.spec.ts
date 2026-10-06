import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, resetBrowserState } from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('Manage Balances dialog scrolls a long recorded-balances list without scrolling the page', async ({
    page,
    request,
}) => {
    await loginAsBrowserTestUser(page, request);

    // A dedicated account so the assertion is not affected by seeded accounts.
    const accountName = `Scroll Test ${Date.now()}`;
    const accountResponse = await request.post('/api/accounts', {
        data: { name: accountName, type: 'bank', primary_currency: 'CAD' },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const account = (await accountResponse.json()).data as { id: number };

    // Enough rows to exceed the viewport height.
    for (let i = 1; i <= 30; i++) {
        const period = `2025${String(i).padStart(2, '0')}`;
        const response = await request.post(
            `/api/accounts/${account.id}/balances`,
            {
                data: {
                    period,
                    recorded_balance_cad: 1000 + i,
                    recorded_balance_usd: 0,
                    recorded_balance_cop: 0,
                },
            },
        );
        expect(response.ok()).toBeTruthy();
    }

    await page.goto('/accounts');

    const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: accountName });
    await card.getByRole('button', { name: 'Manage Balances' }).click();

    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible();

    // Title, description and the new-balance form stay visible.
    await expect(
        dialog.getByText(/Manage Balances/).first(),
    ).toBeVisible();
    await expect(
        dialog.getByText(/Enter the recorded balance for a specific period/),
    ).toBeVisible();
    const saveButton = dialog.getByRole('button', { name: 'Save Balance' });
    await expect(saveButton).toBeVisible();

    // Dialog is limited to about 85vh.
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(viewport!.height * 0.86);

    // The recorded-balances region is the scroll container.
    const scrollRegion = dialog.locator('div.overflow-y-auto').first();
    await expect(scrollRegion).toBeVisible();
    const metrics = await scrollRegion.evaluate((el) => ({
        overflowY: getComputedStyle(el).overflowY,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
    }));
    expect(metrics.overflowY).toBe('auto');
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    const rows = dialog.locator('ul li');
    await expect(rows).toHaveCount(30);

    // Reach the last row by scrolling the list.
    await scrollRegion.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
    });
    await expect(rows.last()).toBeInViewport();
    await page.screenshot({
        path: 'verification/manage-balances-scroll/02-last-row.png',
    });

    // Reach the first row again.
    await scrollRegion.evaluate((el) => {
        el.scrollTop = 0;
    });
    await expect(rows.first()).toBeInViewport();
    await page.screenshot({
        path: 'verification/manage-balances-scroll/01-first-row.png',
    });

    // The form is still reachable while the list is scrolled.
    await expect(saveButton).toBeInViewport();

    // The page behind the dialog did not scroll instead of the list.
    const windowScrollY = await page.evaluate(() => window.scrollY);
    expect(windowScrollY).toBe(0);

    // Short-list check: the scroll region does not show a useless scrollbar
    // when the content fits (a brand-new account has no balances).
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
});

test('Manage Balances dialog with a short list fits content and does not scroll the page', async ({
    page,
    request,
}) => {
    await loginAsBrowserTestUser(page, request);

    const accountName = `Short List ${Date.now()}`;
    const accountResponse = await request.post('/api/accounts', {
        data: { name: accountName, type: 'bank', primary_currency: 'CAD' },
    });
    expect(accountResponse.ok()).toBeTruthy();

    const account = (await accountResponse.json()).data as { id: number };

    const response = await request.post(
        `/api/accounts/${account.id}/balances`,
        {
            data: {
                period: '202501',
                recorded_balance_cad: 500,
                recorded_balance_usd: 0,
                recorded_balance_cop: 0,
            },
        },
    );
    expect(response.ok()).toBeTruthy();

    await page.goto('/accounts');

    const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: accountName });
    await card.getByRole('button', { name: 'Manage Balances' }).click();

    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save Balance' })).toBeVisible();
    await expect(dialog.locator('ul li')).toHaveCount(1);

    // A short list fits its content: the dialog is not stretched to the 85vh cap.
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThan(viewport!.height * 0.85);

    // ... and the list region does not need to scroll.
    const scrollRegion = dialog.locator('div.overflow-y-auto').first();
    const metrics = await scrollRegion.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
    }));
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);

    // The page behind the dialog did not scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.screenshot({
        path: 'verification/manage-balances-scroll/03-short-list.png',
    });
});
