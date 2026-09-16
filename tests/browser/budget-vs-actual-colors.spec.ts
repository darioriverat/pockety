import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function setBudget(
    request: APIRequestContext,
    period: string,
    categoryCode: string,
    amount: number,
): Promise<void> {
    const response = await request.post('/api/budgets', {
        data: {
            period,
            category_code: categoryCode,
            amount_cad: amount,
        },
    });
    expect(response.ok()).toBeTruthy();
}

async function createTransaction(
    request: APIRequestContext,
    categoryCode: string,
    amount: number,
): Promise<void> {
    // Get the category ID first
    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = categories.data.find((c) => c.code === categoryCode);
    expect(category).toBeTruthy();

    // Create transaction
    const response = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: category!.id,
            amount_cad: amount,
            amount_usd: null,
            amount_cop: null,
        },
    });
    expect(response.ok()).toBeTruthy();
}

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 170: under-budget categories display with green colors', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    // Set budget of $1000 for C001 (Groceries)
    await setBudget(request, '202501', 'C001', 1000);
    
    // Create transaction for $800 (under budget)
    await createTransaction(request, 'C001', 800);

    await loginAsBrowserTestUser(page);
    await page.goto('/budgets');

    // Wait for the report to load
    await expect(page.getByTestId('budget-vs-actual-table')).toBeVisible();

    // Find the C001 row
    const row = page.locator('[data-testid="budget-row-C001"]');
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute('data-over-budget', 'false');

    // Check that status badge shows "Under" with green styling
    const statusBadge = row.locator('[data-testid="status-badge-C001"]');
    await expect(statusBadge).toContainText('Under');

    // Check that progress bar exists and is green
    const progressBar = row.locator('[data-testid="progress-bar-C001"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveClass(/bg-green-500/);

    // Take screenshot
    await page.screenshot({
        path: 'verification/test-170-budget-colors/under-budget-green.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 170: over-budget categories display with red colors', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    // Set budget of $500 for C002 (Baking)
    await setBudget(request, '202501', 'C002', 500);
    
    // Create transaction for $600 (over budget)
    await createTransaction(request, 'C002', 600);

    await loginAsBrowserTestUser(page);
    await page.goto('/budgets');

    // Wait for the report to load
    await expect(page.getByTestId('budget-vs-actual-table')).toBeVisible();

    // Find the C002 row
    const row = page.locator('[data-testid="budget-row-C002"]');
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute('data-over-budget', 'true');

    // Check that status badge shows "Over" with red styling
    const statusBadge = row.locator('[data-testid="status-badge-C002"]');
    await expect(statusBadge).toContainText('Over');

    // Check that progress bar exists and is red
    const progressBar = row.locator('[data-testid="progress-bar-C002"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveClass(/bg-red-500/);

    // Take screenshot
    await page.screenshot({
        path: 'verification/test-170-budget-colors/over-budget-red.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 170: progress bars show correct visual proportions', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    // Set budgets with different utilization levels
    await setBudget(request, '202501', 'C004', 1000); // 50% usage
    await createTransaction(request, 'C004', 500);

    await setBudget(request, '202501', 'C005', 1000); // 90% usage
    await createTransaction(request, 'C005', 900);

    await loginAsBrowserTestUser(page);
    await page.goto('/budgets');

    // Wait for the report to load
    await expect(page.getByTestId('budget-vs-actual-table')).toBeVisible();

    // Check C004 (50% usage)
    const row1 = page.locator('[data-testid="budget-row-C004"]');
    await expect(row1).toBeVisible();
    const progressBar1 = row1.locator('[data-testid="progress-bar-C004"]');
    await expect(progressBar1).toBeVisible();
    // Should show approximately 50%
    await expect(row1).toContainText('50%');

    // Check C005 (90% usage)
    const row2 = page.locator('[data-testid="budget-row-C005"]');
    await expect(row2).toBeVisible();
    const progressBar2 = row2.locator('[data-testid="progress-bar-C005"]');
    await expect(progressBar2).toBeVisible();
    // Should show approximately 90%
    await expect(row2).toContainText('90%');

    // Take screenshot showing both
    await page.screenshot({
        path: 'verification/test-170-budget-colors/progress-bars.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
