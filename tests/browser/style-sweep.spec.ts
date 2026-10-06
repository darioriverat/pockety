import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

test.describe('style sweep for pending visual features', () => {
    test('footer, manage balances, account edit, and account filter screenshots', async ({
        page,
    }) => {
        const out = path.join(process.cwd(), 'verification', 'style-sweep');
        mkdirSync(out, { recursive: true });
        const consoleErrors = trackConsoleErrors(page);

        await loginAsBrowserTestUser(page);

        // Feature #6 — footer / header
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/dashboard');
        await expect(
            page.getByRole('heading', { name: /dashboard/i }),
        ).toBeVisible();
        await page.locator('footer').scrollIntoViewIfNeeded();
        await page.screenshot({
            path: path.join(out, 'footer-desktop.png'),
            fullPage: true,
            animations: 'disabled',
        });
        await page
            .locator('footer')
            .screenshot({ path: path.join(out, 'footer-closeup-desktop.png') });
        await page.screenshot({
            path: path.join(out, 'header-desktop.png'),
            clip: { x: 0, y: 0, width: 1440, height: 90 },
            animations: 'disabled',
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/dashboard');
        await page.locator('footer').scrollIntoViewIfNeeded();
        await page.screenshot({
            path: path.join(out, 'footer-mobile.png'),
            fullPage: true,
            animations: 'disabled',
        });

        // Feature #27 — account filter alignment
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/transactions');
        await expect(page.getByTestId('filter-account')).toBeVisible({
            timeout: 15000,
        });
        await page.screenshot({
            path: path.join(out, 'account-filter-desktop.png'),
            fullPage: false,
            animations: 'disabled',
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({
            path: path.join(out, 'account-filter-mobile.png'),
            fullPage: true,
            animations: 'disabled',
        });

        // Feature #20 — account edit dialog with type lock
        await page.setViewportSize({ width: 1440, height: 900 });
        const lockedAccount = await page.request.post('/api/accounts', {
            data: {
                name: `Style Lock ${Date.now()}`,
                type: 'bank',
                primary_currency: 'CAD',
            },
        });
        expect(lockedAccount.ok()).toBeTruthy();
        const lockedBody = await lockedAccount.json();
        const lockedId = lockedBody.data.id as number;

        const categoryResponse = await page.request.get('/api/categories');
        const categories = await categoryResponse.json();
        const categoryId = categories.data[0].id as number;
        const tx = await page.request.post('/api/transactions', {
            data: {
                date: '2026-01-15',
                period: '202601',
                category_id: categoryId,
                account_id: lockedId,
                amount_cad: 25,
                comments: 'style sweep lock',
            },
        });
        expect(tx.ok()).toBeTruthy();

        await page.goto('/accounts');
        await expect(page.getByText(/Style Lock/)).toBeVisible({
            timeout: 15000,
        });
        await page.getByTestId(`edit-account-${lockedId}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByLabel('Account Type')).toBeDisabled();
        await expect(
            page.getByText(
                /The account type cannot be changed because transactions are registered/i,
            ),
        ).toBeVisible();
        await page.getByRole('dialog').screenshot({
            path: path.join(out, 'account-edit-type-locked.png'),
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole('dialog').screenshot({
            path: path.join(out, 'account-edit-type-locked-mobile.png'),
        });
        await page.getByRole('button', { name: /cancel/i }).click();

        // Feature #10 — Manage Balances dialog
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/accounts');
        const manage = page
            .getByRole('button', { name: /manage balances/i })
            .first();
        await expect(manage).toBeVisible({ timeout: 15000 });
        await manage.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('dialog').screenshot({
            path: path.join(out, 'manage-balances-desktop.png'),
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page
            .getByRole('dialog')
            .screenshot({ path: path.join(out, 'manage-balances-mobile.png') });

        const forbidden = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a'))
                .map((a) => a.href)
                .filter(
                    (h) =>
                        h.includes('github.com/dariorivera/pockety') ||
                        h.includes('github.com/laravel/react-starter-kit') ||
                        h.includes('laravel.com/docs/starter-kits'),
                ),
        );
        expect(forbidden).toEqual([]);
        expect(consoleErrors).toEqual([]);
    });
});
