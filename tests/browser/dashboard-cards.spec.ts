import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 141: dashboard cards use consistent spacing, shadows, and borders', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    const incomeGrid = page.getByTestId('dashboard-summary-cards-income');
    const balanceGrid = page.getByTestId('dashboard-summary-cards-balance');
    await expect(incomeGrid).toBeVisible();
    await expect(balanceGrid).toBeVisible();

    const cardIds = [
        'dashboard-card-income',
        'dashboard-card-expenses',
        'dashboard-card-net',
        'dashboard-card-assets',
        'dashboard-card-liabilities',
        'dashboard-card-equity',
    ] as const;

    const cards = [];
    for (const id of cardIds) {
        const card = page.getByTestId(id);
        await expect(card).toBeVisible();
        cards.push(card);
    }

    // Collect computed styles to assert visual consistency
    const styles = await Promise.all(
        cards.map(async (card) =>
            card.evaluate((el) => {
                const cs = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return {
                    borderTopWidth: cs.borderTopWidth,
                    borderLeftWidth: cs.borderLeftWidth,
                    borderTopStyle: cs.borderTopStyle,
                    borderRadius: cs.borderRadius,
                    boxShadow: cs.boxShadow,
                    paddingTop: cs.paddingTop,
                    paddingBottom: cs.paddingBottom,
                    height: Math.round(rect.height),
                };
            }),
        ),
    );

    const first = styles[0];
    for (const style of styles) {
        expect(style.borderTopStyle).toBe('solid');
        expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
        expect(parseFloat(style.borderLeftWidth)).toBeGreaterThan(0);
        expect(style.borderRadius).toBe(first.borderRadius);
        expect(style.boxShadow).not.toBe('none');
        expect(style.boxShadow).toBe(first.boxShadow);
        expect(style.paddingTop).toBe(first.paddingTop);
        expect(style.paddingBottom).toBe(first.paddingBottom);
        // Heights should match within a few pixels (same content structure)
        expect(Math.abs(style.height - first.height)).toBeLessThanOrEqual(4);
    }

    // Uniform gap between cards in the income grid
    const incomeGap = await incomeGrid.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
            columnGap: cs.columnGap,
            rowGap: cs.rowGap,
            display: cs.display,
        };
    });
    expect(incomeGap.display).toBe('grid');
    expect(parseFloat(incomeGap.columnGap)).toBeGreaterThanOrEqual(16);
    expect(incomeGap.columnGap).toBe(incomeGap.rowGap);

    const balanceGap = await balanceGrid.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { columnGap: cs.columnGap, rowGap: cs.rowGap };
    });
    expect(balanceGap.columnGap).toBe(incomeGap.columnGap);
    expect(balanceGap.rowGap).toBe(incomeGap.rowGap);

    await expect(page.getByTestId('dashboard-total-income')).toBeVisible();
    await expect(page.getByTestId('dashboard-total-expenses')).toBeVisible();
    await expect(page.getByTestId('dashboard-total-assets')).toBeVisible();
    await expect(page.getByTestId('dashboard-total-liabilities')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-141-dashboard-cards/01-summary-cards.png',
        fullPage: false,
    });

    await incomeGrid.screenshot({
        path: 'verification/test-141-dashboard-cards/02-income-expense-net.png',
    });
    await balanceGrid.screenshot({
        path: 'verification/test-141-dashboard-cards/03-assets-liabilities-equity.png',
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 142: dashboard layout is responsive across screen sizes', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    const incomeGrid = page.getByTestId('dashboard-summary-cards-income');
    let layout = await incomeGrid.evaluate((el) => {
        const children = Array.from(el.children) as HTMLElement[];
        const tops = children.map((c) => Math.round(c.getBoundingClientRect().top));
        const uniqueRows = new Set(tops).size;
        return {
            uniqueRows,
            childCount: children.length,
            width: el.getBoundingClientRect().width,
        };
    });
    expect(layout.childCount).toBe(3);
    expect(layout.uniqueRows).toBe(1); // single row on desktop

    await page.screenshot({
        path: 'verification/test-142-dashboard-responsive/01-desktop-1920.png',
        fullPage: false,
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    layout = await incomeGrid.evaluate((el) => {
        const children = Array.from(el.children) as HTMLElement[];
        const tops = children.map((c) => Math.round(c.getBoundingClientRect().top));
        const uniqueRows = new Set(tops).size;
        const widths = children.map((c) => Math.round(c.getBoundingClientRect().width));
        return {
            uniqueRows,
            childCount: children.length,
            widths,
            width: el.getBoundingClientRect().width,
        };
    });
    expect(layout.uniqueRows).toBeGreaterThanOrEqual(2); // reflows to 2 rows

    await page.screenshot({
        path: 'verification/test-142-dashboard-responsive/02-tablet-768.png',
        fullPage: false,
    });

    // Mobile — cards stack vertically
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    layout = await incomeGrid.evaluate((el) => {
        const children = Array.from(el.children) as HTMLElement[];
        const tops = children.map((c) => Math.round(c.getBoundingClientRect().top));
        const uniqueRows = new Set(tops).size;
        const widths = children.map((c) => Math.round(c.getBoundingClientRect().width));
        const readable = children.every((c) => {
            const cs = window.getComputedStyle(c);
            return parseFloat(cs.fontSize) >= 12 && c.getBoundingClientRect().height > 40;
        });
        return {
            uniqueRows,
            childCount: children.length,
            widths,
            readable,
        };
    });
    expect(layout.uniqueRows).toBe(3); // stacked
    expect(layout.readable).toBe(true);
    // Each card should take nearly full width
    for (const w of layout.widths) {
        expect(w).toBeGreaterThan(300);
    }

    await page.screenshot({
        path: 'verification/test-142-dashboard-responsive/03-mobile-375.png',
        fullPage: false,
    });

    await page.getByTestId('dashboard-summary-cards-balance').screenshot({
        path: 'verification/test-142-dashboard-responsive/04-mobile-balance-cards.png',
    });

    expect(consoleErrors).toEqual([]);
});
