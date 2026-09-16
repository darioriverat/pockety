import { expect, test, type Locator } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-144-button-styles';
const background = (button: Locator) => button.evaluate((element) => getComputedStyle(element).backgroundColor);

test('income period stays synchronized with the header and navigation', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await loginAsBrowserTestUser(page);
    await page.getByRole('link', { name: 'Income', exact: true }).click();
    await page.getByTestId('period-selector').click();
    await page.getByRole('option', { name: 'August 2026', exact: true }).click();
    await expect(page.locator('#period')).toHaveValue('202608');
    await page.getByRole('button', { name: 'Add Income', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('August 2026 (202608)');
    await page.screenshot({ path: `${evidence}/period-header.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.locator('#period').fill('202607');
    await page.getByRole('button', { name: 'Load Period' }).click();
    await expect(page.getByTestId('period-selector')).toHaveText('July 2026');
    await page.getByRole('button', { name: 'Add Income', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('July 2026 (202607)');
    await page.screenshot({ path: `${evidence}/period-input.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByTestId('nav-link-transactions').click();
    await expect(page.getByTestId('page-period-selector')).toHaveText('July 2026');
    expect(errors).toEqual([]);
});

for (const theme of ['light', 'dark'] as const) {
    test(`primary and secondary button hierarchy and interactions in ${theme}`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);
        await page.getByRole('link', { name: 'Income', exact: true }).click();
        const add = page.getByRole('button', { name: 'Add Income', exact: true });
        const load = page.getByRole('button', { name: 'Load Period' });
        await expect(add).toBeEnabled();
        await expect(load).toBeEnabled();
        expect(await background(add)).not.toBe(await background(load));
        await page.screenshot({ path: `${evidence}/${theme}-page.png`, animations: 'disabled' });
        for (const [name, button] of [['primary', add], ['secondary', load]] as const) {
            const before = await background(button);
            await button.hover();
            await expect.poll(() => background(button)).not.toBe(before);
            await page.screenshot({ path: `${evidence}/${theme}-${name}-hover.png`, animations: 'disabled' });
            await page.mouse.move(0, 0);
        }
        await add.click();
        const dialog = page.getByRole('dialog');
        const save = dialog.getByRole('button', { name: 'Save Income' });
        const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
        await expect.poll(async () => (await save.boundingBox())!.height).toBe(36);
        await expect.poll(async () => (await cancel.boundingBox())!.height).toBe(36);
        expect(await background(save)).not.toBe(await background(cancel));
        await page.screenshot({ path: `${evidence}/${theme}-dialog.png`, animations: 'disabled' });
        const before = await background(cancel);
        await cancel.hover();
        await expect.poll(() => background(cancel)).not.toBe(before);
        await page.screenshot({ path: `${evidence}/${theme}-cancel-hover.png`, animations: 'disabled' });
        await cancel.click();
        await expect(dialog).toHaveCount(0);
        await add.click();
        await expect.poll(async () => (await dialog.boundingBox())!.width).toBe(512);
        // Navigate to both actions using the keyboard from the last form field.
        await dialog.getByLabel('Notes').click();
        await page.keyboard.press('Tab');
        await expect(cancel).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(save).toBeFocused();
        expect(await save.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
        await page.screenshot({ path: `${evidence}/${theme}-save-focus.png`, animations: 'disabled' });
        await page.keyboard.press('Escape');
        await page.getByTestId('nav-link-transactions').click();
        const bulk = page.getByTestId('bulk-edit-button');
        await expect(bulk).toBeDisabled();
        expect(await bulk.evaluate((element) => getComputedStyle(element).opacity)).toBe('0.5');
        await page.screenshot({ path: `${evidence}/${theme}-disabled.png`, animations: 'disabled' });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await bulk.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('none');
        expect(errors).toEqual([]);
    });
}
