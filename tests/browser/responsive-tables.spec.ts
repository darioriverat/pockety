import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-146-responsive-tables';

test.describe('responsive tables on mobile', () => {
    test('transactions list uses card layout and remains interactive at 375px', async ({
        page,
    }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width: 375, height: 812 });
        await loginAsBrowserTestUser(page);

        const categories = await page.request.get('/api/categories');
        expect(categories.ok()).toBeTruthy();
        const categoryPayload = (await categories.json()) as {
            data: Array<{ id: number }>;
        };
        expect(categoryPayload.data.length).toBeGreaterThan(0);
        const categoryId = categoryPayload.data[0].id;

        const create = await page.request.post('/api/transactions', {
            data: {
                date: '2026-09-10',
                period: '202609',
                quincena: 'Q1',
                category_id: categoryId,
                amount_cad: 42.5,
                comments: 'responsive-table-mobile-row',
            },
        });
        expect(create.ok()).toBeTruthy();
        const created = (await create.json()) as { data: { id: number } };
        const transactionId = created.data.id;

        await page.goto('/transactions');
        await page.getByTestId('page-period-selector').click();
        await page
            .getByRole('option', { name: 'September 2026', exact: true })
            .click();

        const table = page.getByTestId('transactions-data-table');
        await expect(table).toBeVisible();
        await expect(table).toHaveAttribute('data-responsive', 'cards');

        const row = page.getByTestId(`transaction-row-${transactionId}`);
        await expect(row).toBeVisible();
        await expect(
            page.getByTestId(`transaction-amount-${transactionId}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`transaction-category-${transactionId}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`transaction-comments-${transactionId}`),
        ).toContainText('responsive-table-mobile-row');

        const actions = page.getByTestId(
            `transaction-actions-${transactionId}`,
        );
        await expect(actions).toBeVisible();
        await expect(
            page.getByTestId(`duplicate-transaction-${transactionId}`),
        ).toBeVisible();
        await expect(row.getByTestId('edit-transaction-button')).toBeVisible();
        await expect(
            row.getByTestId('delete-transaction-button'),
        ).toBeVisible();

        await row.getByTestId('edit-transaction-button').click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByTestId('transaction-form-title')).toHaveText(
            'Edit Transaction',
        );
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);

        await page.getByTestId(`select-transaction-${transactionId}`).click();
        await expect(row).toHaveAttribute('data-selected', 'true');

        // Sort controls remain usable on the narrow viewport
        await page.getByTestId('sort-header-date').click();
        await expect(page.getByTestId('sort-header-date')).toHaveAttribute(
            'aria-sort',
            /ascending|descending/,
        );

        await page.screenshot({
            path: `${evidence}/transactions-mobile-375.png`,
            animations: 'disabled',
            fullPage: true,
        });

        expect(errors).toEqual([]);
    });

    test('income table scrolls horizontally on mobile without clipping columns', async ({
        page,
    }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width: 375, height: 812 });
        await loginAsBrowserTestUser(page);

        const description = `Mobile scroll income ${Date.now()}`;
        const create = await page.request.post('/api/income', {
            data: {
                period: '202609',
                description,
                amount_cad: 1000,
                amount_usd: 50,
                amount_cop: 500000,
            },
        });
        expect(create.ok()).toBeTruthy();

        await page.goto('/income');
        await page.locator('#period').fill('202609');
        await page.getByRole('button', { name: 'Load Period' }).click();

        const table = page.getByTestId('income-data-table');
        await expect(table).toBeVisible({ timeout: 15000 });
        await expect(table).toHaveAttribute('data-responsive', 'scroll');
        await expect(page.getByText(description).first()).toBeVisible();

        const scrollMetrics = await table.evaluate((el) => ({
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
            overflowX: getComputedStyle(el).overflowX,
        }));
        expect(scrollMetrics.overflowX).toMatch(/auto|scroll/);
        expect(scrollMetrics.scrollWidth).toBeGreaterThan(
            scrollMetrics.clientWidth,
        );

        await table.evaluate((el) => {
            el.scrollLeft = el.scrollWidth;
        });
        await expect
            .poll(async () => table.evaluate((el) => el.scrollLeft))
            .toBeGreaterThan(0);

        await page.screenshot({
            path: `${evidence}/income-mobile-scroll-375.png`,
            animations: 'disabled',
            fullPage: true,
        });

        expect(errors).toEqual([]);
    });
});
