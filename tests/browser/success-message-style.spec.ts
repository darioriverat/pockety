import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-151-success-messages';

function relativeLuminance(rgb: number[]): number {
    const channels = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (
        channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    );
}

function contrastRatio(a: number[], b: number[]): number {
    const luminances = [relativeLuminance(a), relativeLuminance(b)];
    return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
}

for (const theme of ['light', 'dark'] as const) {
    test(`success toast is green with icon and dismiss in ${theme}`, async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page);

        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesPayload = (await categoriesResponse.json()) as {
            data: Array<{ id: number; code: string; name_en: string }>;
        };
        const groceries = categoriesPayload.data.find(
            (item) => item.code === 'C001',
        );
        expect(groceries).toBeTruthy();

        await page.goto('/transactions');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: 'January 2025', exact: true })
            .click();
        await expect(page.getByTestId('transactions-heading')).toBeVisible();

        await page.getByRole('button', { name: /add transaction/i }).click();
        await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();
        await page.getByTestId('transaction-date-input').fill('2025-01-22');
        await expect(page.getByTestId('transaction-period-input')).toHaveValue(
            '202501',
        );
        await page.getByRole('combobox', { name: 'Category' }).click();
        await page.getByRole('option', { name: /Groceries|MERCADO/ }).click();
        await page.getByTestId('transaction-amount-input').fill('42.00');
        await page.getByTestId('transaction-form-submit').click();

        const toast = page.locator(
            '[data-sonner-toast][data-type="success"]',
        );
        await expect(toast).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText('Transaction created successfully'),
        ).toBeVisible();

        // Success checkmark icon (custom CheckCircle2)
        await expect(page.getByTestId('success-toast-icon')).toBeVisible();

        // Close / dismiss control present
        const closeButton = toast.locator('[data-close-button]');
        await expect(closeButton).toBeVisible();

        const colors = await toast.evaluate((element) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            const rgb = (color: string) => {
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                return Array.from(
                    context.getImageData(0, 0, 1, 1).data,
                ).slice(0, 3);
            };
            const style = getComputedStyle(element);
            return {
                text: rgb(style.color),
                background: rgb(style.backgroundColor),
                richColors: element.getAttribute('data-rich-colors'),
            };
        });

        expect(colors.richColors).toBe('true');
        // Green: green channel dominates red/blue for success text
        expect(colors.text[1]).toBeGreaterThan(colors.text[0]);
        expect(colors.text[1]).toBeGreaterThan(colors.text[2]);
        expect(
            contrastRatio(colors.text, colors.background),
        ).toBeGreaterThanOrEqual(4.5);

        await page.screenshot({
            path: `${evidence}/${theme}-success-toast.png`,
            fullPage: true,
        });

        // Dismiss via close button
        await closeButton.click();
        await expect(toast).toHaveCount(0, { timeout: 5000 });

        await page.screenshot({
            path: `${evidence}/${theme}-after-dismiss.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
}
