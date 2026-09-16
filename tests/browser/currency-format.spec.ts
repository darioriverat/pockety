import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
    formatCurrencyAmount,
    formatDisplayCurrency,
} from '../../resources/js/lib/currency';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-147-currency-format';

test.describe('currency amount formatting', () => {
    test('transactions show thousand separators and currency decimals', async ({
        page,
    }) => {
        mkdirSync(evidence, { recursive: true });
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);

        const categories = await page.request.get('/api/categories');
        expect(categories.ok()).toBeTruthy();
        const categoryPayload = (await categories.json()) as {
            data: Array<{ id: number }>;
        };
        expect(categoryPayload.data.length).toBeGreaterThan(0);
        const categoryId = categoryPayload.data[0].id;

        const cadExpected = formatDisplayCurrency(1234.56, 'CAD');
        const usdExpected = formatDisplayCurrency(1234.56, 'USD');
        const copExpected = formatDisplayCurrency(2000000, 'COP');

        expect(cadExpected).toContain('1,234.56');
        expect(usdExpected).toContain('1,234.56');
        expect(copExpected).toContain('2,000,000');
        expect(copExpected).not.toMatch(/2\.000\.000/);

        const cadCreate = await page.request.post('/api/transactions', {
            data: {
                date: '2026-09-11',
                period: '202609',
                quincena: 'Q1',
                category_id: categoryId,
                amount_cad: 1234.56,
                comments: 'currency-format-cad',
            },
        });
        expect(cadCreate.ok()).toBeTruthy();
        const cadId = ((await cadCreate.json()) as { data: { id: number } })
            .data.id;

        const usdCreate = await page.request.post('/api/transactions', {
            data: {
                date: '2026-09-12',
                period: '202609',
                quincena: 'Q1',
                category_id: categoryId,
                amount_usd: 1234.56,
                comments: 'currency-format-usd',
            },
        });
        expect(usdCreate.ok()).toBeTruthy();
        const usdId = ((await usdCreate.json()) as { data: { id: number } })
            .data.id;

        const copCreate = await page.request.post('/api/transactions', {
            data: {
                date: '2026-09-13',
                period: '202609',
                quincena: 'Q1',
                category_id: categoryId,
                amount_cop: 2000000,
                comments: 'currency-format-cop',
            },
        });
        expect(copCreate.ok()).toBeTruthy();
        const copId = ((await copCreate.json()) as { data: { id: number } })
            .data.id;

        await page.goto('/transactions');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: 'September 2026', exact: true })
            .click();

        const cadAmount = page.getByTestId(`transaction-amount-${cadId}`);
        const usdAmount = page.getByTestId(`transaction-amount-${usdId}`);
        const copAmount = page.getByTestId(`transaction-amount-${copId}`);

        await expect(cadAmount).toBeVisible();
        await expect(usdAmount).toBeVisible();
        await expect(copAmount).toBeVisible();

        await expect(cadAmount).toHaveText(cadExpected);
        await expect(usdAmount).toHaveText(usdExpected);
        await expect(copAmount).toHaveText(copExpected);

        await expect(cadAmount).toContainText('1,234.56');
        await expect(usdAmount).toContainText('1,234.56');
        await expect(copAmount).toContainText('2,000,000');
        await expect(copAmount).not.toContainText('2.000.000');
        await expect(copAmount).not.toContainText('2,000,000.00');

        // Shared helper still returns the same string used in the UI
        expect(formatCurrencyAmount(1234.56, 'CAD')).toBe(cadExpected);

        await page.screenshot({
            path: `${evidence}/transactions-currency-format.png`,
            fullPage: true,
        });
        await cadAmount.screenshot({
            path: `${evidence}/cad-amount.png`,
        });
        await usdAmount.screenshot({
            path: `${evidence}/usd-amount.png`,
        });
        await copAmount.screenshot({
            path: `${evidence}/cop-amount.png`,
        });

        expect(errors).toEqual([]);
    });

    test('balance sheet amounts keep comma separators and COP without decimals', async ({
        page,
    }) => {
        mkdirSync(evidence, { recursive: true });
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);

        const seedFixed = await page.request.get(
            '/dev/seed-balance-sheet-fixture?period=202501&book_value=25000',
        );
        expect(seedFixed.ok()).toBeTruthy();

        await page.goto('/balance-sheet');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: 'January 2025', exact: true })
            .click();

        await expect(page.getByTestId('balance-sheet-summary')).toBeVisible({
            timeout: 15000,
        });

        const cadText = await page.getByTestId('total-assets-cad').innerText();
        const usdText = await page.getByTestId('total-assets-usd').innerText();
        const copText = await page.getByTestId('total-assets-cop').innerText();

        // Fixture seeds 25,000 CAD book value; formatting must include commas + 2 decimals for CAD/USD
        expect(cadText).toMatch(/\d{1,3}(,\d{3})+\.\d{2}/);
        expect(usdText).toMatch(/\d,\d{3}\.\d{2}|\d+\.\d{2}/);
        // COP should never use Spanish period grouping or forced .00 decimals
        expect(copText).not.toMatch(/\d\.\d{3}\.\d{3}/);
        expect(copText).not.toMatch(/,\d{3}\.\d{2}$/);

        await page.screenshot({
            path: `${evidence}/balance-sheet-currency-format.png`,
            fullPage: true,
        });

        expect(errors).toEqual([]);
    });
});
