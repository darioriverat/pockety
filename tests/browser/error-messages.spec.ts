import { test, expect } from '@playwright/test';
import { loginAsBrowserTestUser } from './helpers';

const evidence = 'verification/test-150-error-messages';

for (const theme of ['light', 'dark'] as const) {
    test(`validation errors are readable with icons in ${theme}`, async ({ page }) => {
        const errors: string[] = [];
        page.on('console', message => {
            if (message.type() === 'error') errors.push(message.text());
        });
        page.on('pageerror', error => errors.push(error.message));
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page);
        await page.goto('/transactions');
        await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
        const dialog = page.getByTestId('transaction-form-dialog');
        await expect(dialog).toBeVisible();
        await page.screenshot({ path: `${evidence}/${theme}-form.png` });
        await page.getByTestId('transaction-date-input').fill('');
        await page.getByTestId('transaction-amount-input').fill('-100');
        await page.getByTestId('transaction-form-submit').click();

        for (const [field, message] of [
            ['date', 'Date is required'],
            ['category', 'Category is required'],
            ['amount', 'Amount must be a positive number'],
        ]) {
            const error = page.getByTestId(`${field}-error`);
            await expect(error).toBeVisible();
            await expect(error).toContainText(message);
            await expect(error.locator('svg')).toBeVisible();
            const input = field === 'category' ? dialog.getByRole('combobox', { name: 'Category', exact: true }) : page.getByTestId(`transaction-${field}-input`);
            const inputBox = await input.boundingBox();
            const errorBox = await error.boundingBox();
            expect(inputBox).not.toBeNull();
            expect(errorBox).not.toBeNull();
            expect(errorBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
            expect(errorBox!.y - inputBox!.y - inputBox!.height).toBeLessThan(20);
            // Read rendered colors only; all form interactions use normal UI controls.
            const colors = await error.evaluate(element => {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                const context = canvas.getContext('2d')!;
                const rgb = (color: string) => {
                    context.fillStyle = color;
                    context.fillRect(0, 0, 1, 1);
                    return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
                };
                return {
                    text: rgb(getComputedStyle(element).color),
                    background: rgb(getComputedStyle(element.closest('[role="dialog"]')!).backgroundColor),
                };
            });
            expect(colors.text[0]).toBeGreaterThan(colors.text[1]);
            expect(colors.text[0]).toBeGreaterThan(colors.text[2]);
            const luminance = (rgb: number[]) => rgb.map(value => {
                const channel = value / 255;
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
            const values = [luminance(colors.text), luminance(colors.background)];
            expect((Math.max(...values) + 0.05) / (Math.min(...values) + 0.05)).toBeGreaterThanOrEqual(4.5);
        }
        await page.screenshot({ path: `${evidence}/${theme}-errors.png` });
        // Correct the inputs and resubmit to verify stale errors disappear.
        await page.getByTestId('transaction-date-input').fill('2026-09-16');
        await page.getByTestId('transaction-amount-input').fill('100');
        await page.getByTestId('transaction-form-submit').click();
        await expect(page.getByTestId('date-error')).toHaveCount(0);
        await expect(page.getByTestId('amount-error')).toHaveCount(0);
        await expect(page.getByTestId('category-error')).toBeVisible();
        await page.screenshot({ path: `${evidence}/${theme}-corrected.png` });
        expect(errors).toEqual([]);
    });
}
