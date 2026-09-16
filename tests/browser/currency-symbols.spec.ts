import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
    currencySymbol,
    formatDisplayCurrency,
} from '../../resources/js/lib/currency';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-148-currency-symbols';

test.describe('currency symbols', () => {
    test('dashboard and transactions show distinguishable CAD, USD, and COP symbols', async ({
        page,
    }) => {
        mkdirSync(evidence, { recursive: true });
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);

        // Unit-level contract used by the UI formatter
        expect(currencySymbol('CAD')).toBe('$');
        expect(currencySymbol('USD')).toBe('US$');
        expect(currencySymbol('COP')).toBe('COP');
        expect(formatDisplayCurrency(1234.56, 'CAD')).toBe('$1,234.56');
        expect(formatDisplayCurrency(1234.56, 'USD')).toBe('US$1,234.56');
        expect(formatDisplayCurrency(2000000, 'COP')).toBe('COP 2,000,000');

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

        const cadCreate = await page.request.post('/api/transactions', {
            data: {
                date: '2026-09-11',
                period: '202609',
                quincena: 'Q1',
                category_id: categoryId,
                amount_cad: 1234.56,
                comments: 'currency-symbol-cad',
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
                comments: 'currency-symbol-usd',
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
                comments: 'currency-symbol-cop',
            },
        });
        expect(copCreate.ok()).toBeTruthy();
        const copId = ((await copCreate.json()) as { data: { id: number } })
            .data.id;

        // Step 1–2: dashboard screenshot (symbols appear on summary cards)
        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({
            timeout: 15000,
        });
        await page.screenshot({
            path: `${evidence}/dashboard-currency-symbols.png`,
            fullPage: true,
        });

        // Step 3–5: transactions list — symbols with amounts, distinguishable, consistent position
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

        const cadText = await cadAmount.innerText();
        const usdText = await usdAmount.innerText();
        const copText = await copAmount.innerText();

        expect(cadText).toMatch(/^\$/);
        expect(usdText).toMatch(/^US\$/);
        expect(copText).toMatch(/^COP /);
        expect(cadText).not.toBe(usdText);
        expect(cadText).not.toBe(copText);
        expect(usdText).not.toBe(copText);

        // Symbol consistently before the numeric amount
        expect(cadText.indexOf('$')).toBeLessThan(cadText.indexOf('1'));
        expect(usdText.indexOf('US$')).toBeLessThan(usdText.indexOf('1'));
        expect(copText.indexOf('COP')).toBeLessThan(copText.indexOf('2'));

        await page.screenshot({
            path: `${evidence}/transactions-currency-symbols.png`,
            fullPage: true,
        });
        await cadAmount.screenshot({ path: `${evidence}/cad-symbol.png` });
        await usdAmount.screenshot({ path: `${evidence}/usd-symbol.png` });
        await copAmount.screenshot({ path: `${evidence}/cop-symbol.png` });

        // Balance sheet also shows all three symbols side by side
        await page.goto('/balance-sheet');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: 'January 2025', exact: true })
            .click();
        await expect(page.getByTestId('balance-sheet-summary')).toBeVisible({
            timeout: 15000,
        });

        const assetsCad = await page.getByTestId('total-assets-cad').innerText();
        const assetsUsd = await page.getByTestId('total-assets-usd').innerText();
        const assetsCop = await page.getByTestId('total-assets-cop').innerText();

        expect(assetsCad).toMatch(/^\$/);
        expect(assetsUsd).toMatch(/^US\$/);
        expect(assetsCop).toMatch(/^COP /);
        expect(assetsCad).not.toEqual(assetsUsd);

        await page.screenshot({
            path: `${evidence}/balance-sheet-currency-symbols.png`,
            fullPage: true,
        });

        expect(errors).toEqual([]);
    });
});
