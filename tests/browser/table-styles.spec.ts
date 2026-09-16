import { expect, test, type Locator } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-145-table-styles';

async function backgroundOf(locator: Locator): Promise<string> {
    return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.describe('data table presentation', () => {
    for (const theme of ['light', 'dark'] as const) {
        test(`transactions table has headers, striping, and hover in ${theme}`, async ({
            page,
        }) => {
            const errors = trackConsoleErrors(page);
            page.on('pageerror', (error) => errors.push(error.message));
            await page.emulateMedia({ colorScheme: theme });
            await page.setViewportSize({ width: 1440, height: 900 });
            await loginAsBrowserTestUser(page);

            const categories = await page.request.get('/api/categories');
            expect(categories.ok()).toBeTruthy();
            const categoryPayload = (await categories.json()) as {
                data: Array<{ id: number }>;
            };
            expect(categoryPayload.data.length).toBeGreaterThan(0);
            const categoryId = categoryPayload.data[0].id;

            for (const [index, amount] of [11.11, 22.22, 33.33].entries()) {
                const response = await page.request.post('/api/transactions', {
                    data: {
                        date: `2026-09-0${index + 1}`,
                        period: '202609',
                        quincena: 'Q1',
                        category_id: categoryId,
                        amount_cad: amount,
                        comments: `table-style-row-${index}`,
                    },
                });
                expect(response.ok()).toBeTruthy();
            }

            await page.goto('/transactions');
            await page.getByTestId('page-period-selector').click();
            await page.getByRole('option', { name: 'September 2026', exact: true }).click();
            await expect(page.getByTestId('transactions-data-table')).toBeVisible();

            const headers = page.getByTestId('transactions-sort-headers');
            await expect(headers).toBeVisible();
            expect(await backgroundOf(headers)).not.toBe('rgba(0, 0, 0, 0)');
            await expect(headers.getByText('Date', { exact: true })).toBeVisible();
            await expect(headers.getByText('Amount', { exact: true })).toBeVisible();
            await expect(headers.getByText('Category', { exact: true })).toBeVisible();
            await expect(headers.getByText('Actions', { exact: true })).toBeVisible();

            const rows = page.locator('[data-testid^="transaction-row-"]');
            await expect(rows.first()).toBeVisible();
            await expect.poll(async () => rows.count()).toBeGreaterThanOrEqual(2);

            const first = rows.nth(0);
            const second = rows.nth(1);
            const firstBg = await backgroundOf(first);
            const secondBg = await backgroundOf(second);
            expect(firstBg).not.toBe(secondBg);

            await page.screenshot({
                path: `${evidence}/${theme}-table.png`,
                animations: 'disabled',
            });

            const beforeHover = await backgroundOf(first);
            await first.hover();
            await expect.poll(() => backgroundOf(first)).not.toBe(beforeHover);
            await page.screenshot({
                path: `${evidence}/${theme}-row-hover.png`,
                animations: 'disabled',
            });
            await page.mouse.move(0, 0);

            expect(errors).toEqual([]);
        });
    }
});
