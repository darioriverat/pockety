import {
    expect,
    test,
    type APIRequestContext,
    type Page } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
    ensureExchangeRateForPeriod,
} from './helpers';

async function seedOverwriteScenario(page: Page, request: APIRequestContext) {
    await loginAsBrowserTestUser(page, request);

    await ensureExchangeRateForPeriod(request, '202501', { copPerUsd: 4400, cadPerUsd: 0.75 });

    const bankResponse = await request.post('/api/accounts', {
        data: {
            name: 'Overwrite Dialog Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(bankResponse.ok()).toBeTruthy();
    const bank = (await bankResponse.json()).data;

    const balanceResponse = await request.post(
        `/api/accounts/${bank.id}/balances`,
        {
            data: {
                period: '202501',
                recorded_balance_cad: 1000,
                recorded_balance_usd: 0,
                recorded_balance_cop: 0,
            },
        },
    );
    expect(balanceResponse.ok()).toBeTruthy();

    const categoriesResponse = await request.get('/api/categories');
    const categories: ApiCategory[] = (await categoriesResponse.json()).data;
    const groceries = categories.find((category) => category.code === 'C001');
    expect(groceries).toBeTruthy();

    const firstSpend = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            category_id: groceries!.id,
            account_id: bank.id,
            amount_cad: 100,
            comments: 'overwrite-dialog-first',
        },
    });
    expect(firstSpend.ok()).toBeTruthy();

    await page.goto('/period-balances');
    await expect(page.getByTestId('period-balances-heading')).toBeVisible();
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'January 2025', exact: true }).click();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'January 2025',
    );
    await expect(page.getByTestId('proposed-assets-cad')).toHaveText('$900.00');
    await page.getByTestId('register-period-balance').click();
    await expect(page.getByTestId('period-balance-success')).toContainText(
        'registered',
    );

    const secondSpend = await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            category_id: groceries!.id,
            account_id: bank.id,
            amount_cad: 50,
            comments: 'overwrite-dialog-second',
        },
    });
    expect(secondSpend.ok()).toBeTruthy();

    await page.reload();
    await expect(page.getByTestId('proposed-assets-cad')).toHaveText('$750.00');
    await expect(page.getByTestId('registered-assets-cad')).toHaveText(
        '$900.00',
    );
}

test.beforeEach(() => {
    resetBrowserState();
});

test('overwrite dialog layout is wide, side-by-side, and readable on desktop', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedOverwriteScenario(page, request);

    await page.getByTestId('register-period-balance').click();
    const dialog = page.getByTestId('overwrite-balance-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('overwrite-balance-title')).toBeVisible();
    await expect(page.getByTestId('overwrite-balance-cancel')).toBeVisible();
    await expect(page.getByTestId('overwrite-balance-confirm')).toBeVisible();
    await expect(page.getByTestId('overwrite-existing-assets-cad')).toHaveText(
        '$900.00',
    );
    await expect(page.getByTestId('overwrite-proposed-assets-cad')).toHaveText(
        '$750.00',
    );

    await expect(dialog).toHaveClass(/sm:max-w-3xl/);

    const layout = await page.evaluate(() => {
        const dialogEl = document.querySelector(
            '[data-testid="overwrite-balance-dialog"]',
        ) as HTMLElement | null;
        const comparison = document.querySelector(
            '[data-testid="overwrite-balance-comparison"]',
        ) as HTMLElement | null;
        const existingCol = document.querySelector(
            '[data-testid="overwrite-existing-column"]',
        ) as HTMLElement | null;
        const proposedCol = document.querySelector(
            '[data-testid="overwrite-proposed-column"]',
        ) as HTMLElement | null;
        const existingGrid = document.querySelector(
            '[data-testid="overwrite-existing-assets-cad"]',
        )?.closest('dl') as HTMLElement | null;
        const proposedGrid = document.querySelector(
            '[data-testid="overwrite-proposed-assets-cad"]',
        )?.closest('dl') as HTMLElement | null;
        const title = document.querySelector(
            '[data-testid="overwrite-balance-title"]',
        ) as HTMLElement | null;
        const closeBtn = document.querySelector(
            '[data-testid="dialog-close"]',
        ) as HTMLElement | null;

        if (
            !dialogEl ||
            !comparison ||
            !existingCol ||
            !proposedCol ||
            !existingGrid ||
            !proposedGrid ||
            !title ||
            !closeBtn
        ) {
            return { ok: false as const, reason: 'missing elements' };
        }

        const dialogRect = dialogEl.getBoundingClientRect();
        const existingRect = existingCol.getBoundingClientRect();
        const proposedRect = proposedCol.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const closeRect = closeBtn.getBoundingClientRect();
        const sideBySide =
            Math.abs(existingRect.top - proposedRect.top) < 8 &&
            proposedRect.left > existingRect.right - 4;
        const titleNotCovered =
            titleRect.right <= closeRect.left - 4 ||
            titleRect.bottom <= closeRect.top - 4;
        const noOverlap =
            existingRect.right <= proposedRect.left + 2 ||
            proposedRect.right <= existingRect.left + 2;

        return {
            ok: true as const,
            dialogWidth: dialogRect.width,
            sideBySide,
            noOverlap,
            titleNotCovered,
            existingGridCols: getComputedStyle(existingGrid).gridTemplateColumns,
            proposedGridCols: getComputedStyle(proposedGrid).gridTemplateColumns,
            comparisonCols: getComputedStyle(comparison).gridTemplateColumns,
        };
    });

    expect(layout.ok).toBeTruthy();
    if (!layout.ok) {
        throw new Error(layout.reason);
    }
    expect(layout.dialogWidth).toBeGreaterThan(700);
    expect(layout.sideBySide).toBeTruthy();
    expect(layout.noOverlap).toBeTruthy();
    expect(layout.titleNotCovered).toBeTruthy();
    expect(layout.existingGridCols.split(' ').length).toBe(1);
    expect(layout.proposedGridCols.split(' ').length).toBe(1);
    expect(layout.comparisonCols.split(' ').length).toBe(2);

    await page.screenshot({
        path: 'verification/period-balance-overwrite-dialog/desktop.png',
        animations: 'disabled',
    });

    expect(consoleErrors).toEqual([]);
});

test('overwrite dialog stacks on mobile and cancel preserves balance', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await seedOverwriteScenario(page, request);

    await page.getByTestId('register-period-balance').click();
    await expect(page.getByTestId('overwrite-balance-dialog')).toBeVisible();

    const mobileLayout = await page.evaluate(() => {
        const existingCol = document.querySelector(
            '[data-testid="overwrite-existing-column"]',
        ) as HTMLElement | null;
        const proposedCol = document.querySelector(
            '[data-testid="overwrite-proposed-column"]',
        ) as HTMLElement | null;
        if (!existingCol || !proposedCol) {
            return { ok: false as const };
        }
        const existingRect = existingCol.getBoundingClientRect();
        const proposedRect = proposedCol.getBoundingClientRect();
        return {
            ok: true as const,
            stacked: proposedRect.top >= existingRect.bottom - 2,
            existingLeft: existingRect.left,
            proposedLeft: proposedRect.left,
        };
    });

    expect(mobileLayout.ok).toBeTruthy();
    if (!mobileLayout.ok) {
        throw new Error('missing columns');
    }
    expect(mobileLayout.stacked).toBeTruthy();

    await page.screenshot({
        path: 'verification/period-balance-overwrite-dialog/mobile.png',
        animations: 'disabled',
    });

    await page.getByTestId('overwrite-balance-cancel').click();
    await expect(page.getByTestId('overwrite-balance-dialog')).toHaveCount(0);
    await expect(page.getByTestId('registered-assets-cad')).toHaveText(
        '$900.00',
    );
    await expect(page.getByTestId('proposed-assets-cad')).toHaveText('$750.00');

    expect(consoleErrors).toEqual([]);
});
