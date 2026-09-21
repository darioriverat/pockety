import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

test('dashboard period selector matches and updates the displayed summary', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await loginAsBrowserTestUser(page);
    const selector = page.getByTestId('period-selector');
    const initialPeriod = await selector.innerText();
    await expect(page.getByText(`Financial overview for ${initialPeriod}`)).toBeVisible();
    for (const id of ['income', 'expenses', 'net']) {
        await expect(page.getByTestId(`dashboard-card-${id}`)).toBeVisible();
    }
    await page.screenshot({ animations: 'disabled', path: 'verification/session-75/01-dashboard-current.png' });
    await selector.click();
    await page.getByRole('option', { name: 'August 2026', exact: true }).click();
    await expect(page).toHaveURL(/period=202608/);
    await expect(selector).toHaveText('August 2026');
    await expect(page.getByText('Financial overview for August 2026')).toBeVisible();
    await page.screenshot({ animations: 'disabled', path: 'verification/session-75/02-dashboard-selected.png' });
    await page.getByTestId('nav-link-transactions').click();
    await expect(page.getByTestId('page-period-selector')).toHaveText('August 2026');
    expect(errors).toEqual([]);
});

for (const theme of ['light', 'dark'] as const) {
    test(`feature 143: transaction form labels, spacing and keyboard focus in ${theme} mode`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);
        await page.getByTestId('nav-link-transactions').click();
        await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
        const dialog = page.getByTestId('transaction-form-dialog');
        await expect(dialog).toBeVisible();
        await page.screenshot({ animations: 'disabled', path: `verification/test-143-form-presentation/${theme}-01-form.png` });

        const ids = ['date', 'period', 'quincena', 'category', 'account', 'currency', 'amount', 'comments', 'is_recurring', 'is_credit'];
        for (const id of ids) {
            await expect(dialog.locator(`label[for="${id}"]`)).toBeVisible();
            await expect(dialog.locator(`#${id}`)).toHaveAccessibleName(/\S/);
        }
        // Start from the text field, then use actual keyboard navigation.
        await dialog.locator('#date').click();
        for (const id of ids.slice(1)) {
            await page.keyboard.press('Tab');
            const field = dialog.locator(`#${id}`);
            await expect(field).toBeFocused();
            const focusStyle = await field.evaluate((element) => {
                const style = getComputedStyle(element);
                return { visible: element.matches(':focus-visible'), shadow: style.boxShadow };
            });
            expect(focusStyle.visible).toBe(true);
            expect(focusStyle.shadow).not.toBe('none');
            await page.screenshot({ animations: 'disabled', path: `verification/test-143-form-presentation/${theme}-focus-${id}.png` });
        }
        for (const [left, right] of [['period', 'quincena'], ['currency', 'amount']]) {
            const a = await dialog.locator(`#${left}`).boundingBox();
            const b = await dialog.locator(`#${right}`).boundingBox();
            expect(Math.abs(a!.y - b!.y)).toBeLessThanOrEqual(1);
            expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
            expect(b!.x - a!.x - a!.width).toBe(16);
        }

        await page.setViewportSize({ width: 375, height: 667 });
        await expect.poll(async () => {
            const box = await dialog.boundingBox();
            return box && box.x >= 15 && box.y >= 15 && box.x + box.width <= 360 && box.y + box.height <= 652;
        }).toBe(true);
        await dialog.locator('#date').click();
        await page.screenshot({ animations: 'disabled', path: `verification/test-143-form-presentation/${theme}-mobile-top.png` });
        const bounds = await dialog.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(15);
        expect(bounds!.y).toBeGreaterThanOrEqual(15);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(652);
        for (let i = 0; i < ids.length; i++) await page.keyboard.press('Tab');
        await expect(dialog.getByTestId('transaction-form-submit')).toBeFocused();
        await expect(dialog.getByTestId('transaction-form-submit')).toBeInViewport();
        await page.screenshot({ animations: 'disabled', path: `verification/test-143-form-presentation/${theme}-mobile-bottom.png` });
        await dialog.locator('#category').click();
        await page.getByRole('option', { name: /C009/ }).click();
        const debt = dialog.locator('#debt_component');
        await expect(dialog.locator('label[for="debt_component"]')).toBeVisible();
        await expect(debt).toHaveAccessibleName(/Debt Component/i);
        await dialog.locator('#is_recurring').click();
        await page.keyboard.press('Tab');
        await expect(dialog.locator('#is_credit')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(debt).toBeFocused();
        await expect(debt).toBeInViewport();
        await page.screenshot({ animations: 'disabled', path: `verification/test-143-form-presentation/${theme}-debt-focus.png` });
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        expect(errors).toEqual([]);
    });
}
