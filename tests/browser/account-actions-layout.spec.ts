import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => resetBrowserState());

test('account actions stay within their cards on desktop and mobile', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await page.goto('/accounts');
    await page.getByRole('button', { name: 'Add Account' }).click();
    await page.getByLabel('Account Name').fill('Layout Verification Bank');
    await page.getByLabel('Account Type').click();
    await page
        .getByRole('option', { name: 'Bank Account', exact: true })
        .click();
    await page.getByLabel('Primary Currency').click();
    await page.getByRole('option', { name: 'CAD', exact: true }).click();
    await page
        .getByRole('button', { name: 'Save Account', exact: true })
        .click();
    await expect(page.getByRole('dialog')).toBeHidden();

    const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'Layout Verification Bank' });
    const out = 'verification/account-actions-layout';
    mkdirSync(out, { recursive: true });
    for (const width of [1440, 1024, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(card).toBeVisible();
        const periodBounds = await page
            .getByTestId('period-selector')
            .boundingBox();
        if (!periodBounds) throw new Error('Period selector has no bounds');
        expect(periodBounds.x + periodBounds.width).toBeLessThanOrEqual(width);
        const bounds = await card.boundingBox();
        if (!bounds) throw new Error('Account card has no bounds');
        for (const name of ['Edit', 'View Transactions', 'Manage Balances']) {
            const button = card.getByRole('button', { name, exact: true });
            await expect(button).toBeVisible();
            const box = await button.boundingBox();
            if (!box) throw new Error(`${name} has no bounds`);
            expect(box.x).toBeGreaterThanOrEqual(bounds.x);
            expect(box.x + box.width).toBeLessThanOrEqual(
                bounds.x + bounds.width,
            );
        }
        await page.screenshot({
            path: `${out}/accounts-${width}.png`,
            fullPage: true,
        });
        await card.getByRole('button', { name: 'Edit', exact: true }).click();
        await expect(page.getByLabel('Account Name')).toHaveValue(
            'Layout Verification Bank',
        );
        await page
            .getByRole('dialog')
            .screenshot({ path: `${out}/edit-${width}.png` });
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await card.getByRole('button', { name: 'Manage Balances' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page
            .getByRole('dialog')
            .screenshot({ path: `${out}/balances-${width}.png` });
        await page.keyboard.press('Escape');
    }
    expect(errors).toEqual([]);
});
