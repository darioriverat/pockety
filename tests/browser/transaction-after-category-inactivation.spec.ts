import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const SHOT_DIR = 'verification/transaction-after-inactivation';
const COMMENT = 'feature-74-survives-inactivation';

test.describe('Existing transaction after category inactivation', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('feature 74: transaction remains valid and appears in UI and reports', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page, request);

        // Step 1: Create category C047
        const createResponse = await request.post('/api/categories', {
            data: {
                name: 'Keep Transaction Category',
                is_debt_category: false,
                is_income_category: false,
            },
        });
        expect(createResponse.status()).toBe(201);
        const created = await createResponse.json();
        expect(created.data.code).toBe('C047');
        expect(created.data.is_active).toBe(true);
        const categoryId = created.data.id as number;

        // Step 2: Create transaction with category_id for C047
        const txnResponse = await request.post('/api/transactions', {
            data: {
                date: '2026-01-15',
                period: '202601',
                category_id: categoryId,
                amount_cad: 87.25,
                comments: COMMENT,
            },
        });
        expect(txnResponse.status()).toBe(201);
        const txnBody = await txnResponse.json();
        const transactionId = txnBody.data.id as number;
        expect(txnBody.data.category_id).toBe(categoryId);

        // Step 3: Inactivate C047
        const inactivateResponse = await request.put('/api/categories/C047', {
            data: { is_active: false },
        });
        expect(inactivateResponse.status()).toBe(200);
        const inactivated = await inactivateResponse.json();
        expect(inactivated.data.is_active).toBe(false);

        await page.goto('/categories');
        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();
        await expect(categoryCard.getByText('Retired')).toBeVisible();
        await categoryCard.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: `${SHOT_DIR}/01-category-retired.png`,
            fullPage: true,
        });

        // Steps 4-6: Query transaction — still exists and points to C047
        const showResponse = await request.get(
            `/api/transactions/${transactionId}`,
        );
        expect(showResponse.ok()).toBeTruthy();
        const showBody = await showResponse.json();
        expect(showBody.data.id).toBe(transactionId);
        expect(showBody.data.category_id).toBe(categoryId);
        expect(showBody.data.category.code).toBe('C047');
        expect(showBody.data.category.name).toBe('Keep Transaction Category');
        expect(showBody.data.category.is_active).toBe(false);
        expect(showBody.data.comments).toBe(COMMENT);

        // Step 7: Verify transaction displays correctly in UI
        await page.goto('/transactions');
        await expect(
            page.getByRole('heading', { name: 'Transactions' }),
        ).toBeVisible();
        await page.getByTestId('page-period-selector').click();
        await page.getByRole('option', { name: 'January 2026', exact: true }).click();
        await expect(page.getByTestId('page-period-selector')).toContainText(
            'January 2026',
        );

        const row = page.getByTestId(`transaction-row-${transactionId}`);
        await expect(row).toBeVisible();
        await expect(
            page.getByTestId(`transaction-comments-${transactionId}`),
        ).toContainText(COMMENT);
        await expect(
            page.getByTestId(`transaction-category-${transactionId}`),
        ).toContainText('C047');
        await expect(
            page.getByTestId(`transaction-category-${transactionId}`),
        ).toContainText('Keep Transaction Category');
        await expect(
            page.getByTestId(`transaction-amount-${transactionId}`),
        ).toContainText('87.25');

        await row.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: `${SHOT_DIR}/02-transaction-ui.png`,
            fullPage: true,
        });

        // Step 8: Verify reports include this transaction
        await page.goto('/category-actuals');
        await page.getByTestId('page-period-selector').click();
        await page.getByRole('option', { name: 'January 2026', exact: true }).click();
        await expect(page.getByTestId('category-actual-row-C047')).toBeVisible();
        await expect(page.getByTestId('category-actual-amount-C047')).toContainText(
            '87.25',
        );
        await page.screenshot({
            path: `${SHOT_DIR}/03-category-actuals.png`,
            fullPage: true,
        });

        await page.goto('/financial-summary');
        await page.getByTestId('page-period-selector').click();
        await page.getByRole('option', { name: 'January 2026', exact: true }).click();
        await expect(page.getByTestId('summary-row-C047')).toBeVisible();
        await expect(page.getByTestId('total-C047')).toContainText('87.25');
        await page.screenshot({
            path: `${SHOT_DIR}/04-financial-summary.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
