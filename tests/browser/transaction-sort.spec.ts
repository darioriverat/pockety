import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function getCategories(request: APIRequestContext) {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
        data: Array<{ id: number; code: string; name_en: string }>;
    };
    return body.data;
}

async function createTransaction(
    request: APIRequestContext,
    data: {
        date: string;
        period: string;
        quincena: 'Q1' | 'Q2';
        category_id: number;
        amount_cad?: number;
        amount_usd?: number;
        comments: string;
    },
) {
    const response = await request.post('/api/transactions', { data });
    expect(response.ok()).toBeTruthy();
}

async function openSeptember2026(page: Page) {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();

    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'September 2026', exact: true }).click();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'September 2026',
    );
}

function rowDates(page: Page): Promise<string[]> {
    return page.locator('[data-testid^="transaction-date-"]').allTextContents();
}

function rowAmounts(page: Page): Promise<string[]> {
    return page.locator('[data-testid^="transaction-amount-"]').allTextContents();
}

function rowCategories(page: Page): Promise<string[]> {
    return page.locator('[data-testid^="transaction-category-"]').allTextContents();
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 120: user can sort transactions table by date', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categories = await getCategories(request);
    const categoryId = categories[0].id;

    await createTransaction(request, {
        date: '2026-09-10',
        period: '202609',
        quincena: 'Q1',
        category_id: categoryId,
        amount_cad: 10,
        comments: 'sort-date-mid',
    });
    await createTransaction(request, {
        date: '2026-09-01',
        period: '202609',
        quincena: 'Q1',
        category_id: categoryId,
        amount_cad: 20,
        comments: 'sort-date-early',
    });
    await createTransaction(request, {
        date: '2026-09-20',
        period: '202609',
        quincena: 'Q2',
        category_id: categoryId,
        amount_cad: 30,
        comments: 'sort-date-late',
    });

    await openSeptember2026(page);
    await expect(page.getByTestId('sort-header-date')).toBeVisible();

    await page.getByTestId('sort-header-date').click();
    await expect(page.getByTestId('sort-header-date')).toHaveAttribute(
        'aria-sort',
        'ascending',
    );

    await expect
        .poll(async () => {
            const dates = await rowDates(page);
            return dates.map((text) => text.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '');
        })
        .toEqual(['2026-09-01', '2026-09-10', '2026-09-20']);

    await page.screenshot({
        path: 'verification/test-120-sort-date/01-date-ascending.png',
        fullPage: true,
    });

    await page.getByTestId('sort-header-date').click();
    await expect(page.getByTestId('sort-header-date')).toHaveAttribute(
        'aria-sort',
        'descending',
    );

    await expect
        .poll(async () => {
            const dates = await rowDates(page);
            return dates.map((text) => text.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '');
        })
        .toEqual(['2026-09-20', '2026-09-10', '2026-09-01']);

    await page.screenshot({
        path: 'verification/test-120-sort-date/02-date-descending.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 121: user can sort transactions table by amount', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categories = await getCategories(request);
    const categoryId = categories[0].id;

    await createTransaction(request, {
        date: '2026-09-01',
        period: '202609',
        quincena: 'Q1',
        category_id: categoryId,
        amount_cad: 50,
        comments: 'sort-amount-50',
    });
    await createTransaction(request, {
        date: '2026-09-02',
        period: '202609',
        quincena: 'Q1',
        category_id: categoryId,
        amount_cad: 10,
        comments: 'sort-amount-10',
    });
    await createTransaction(request, {
        date: '2026-09-03',
        period: '202609',
        quincena: 'Q1',
        category_id: categoryId,
        amount_cad: 25,
        comments: 'sort-amount-25',
    });

    await openSeptember2026(page);

    await page.getByTestId('sort-header-amount').click();
    await expect(page.getByTestId('sort-header-amount')).toHaveAttribute(
        'aria-sort',
        'ascending',
    );

    await expect
        .poll(async () => {
            const amounts = await rowAmounts(page);
            return amounts.map((text) => text.replace(/[^0-9.]/g, ''));
        })
        .toEqual(['10.00', '25.00', '50.00']);

    await page.screenshot({
        path: 'verification/test-121-sort-amount/01-amount-ascending.png',
        fullPage: true,
    });

    await page.getByTestId('sort-header-amount').click();
    await expect(page.getByTestId('sort-header-amount')).toHaveAttribute(
        'aria-sort',
        'descending',
    );

    await expect
        .poll(async () => {
            const amounts = await rowAmounts(page);
            return amounts.map((text) => text.replace(/[^0-9.]/g, ''));
        })
        .toEqual(['50.00', '25.00', '10.00']);

    await page.screenshot({
        path: 'verification/test-121-sort-amount/02-amount-descending.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 122: user can sort transactions table by category', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categories = await getCategories(request);

    const groceries =
        categories.find((c) => c.name_en === 'Groceries') ?? categories[0];
    const transport =
        categories.find((c) => c.name_en === 'Transportation') ??
        categories.find((c) => c.code === 'C004') ??
        categories[1];
    const utilities =
        categories.find((c) => c.name_en === 'Utilities') ??
        categories.find((c) => c.code === 'C010') ??
        categories[2];

    await createTransaction(request, {
        date: '2026-09-01',
        period: '202609',
        quincena: 'Q1',
        category_id: utilities.id,
        amount_cad: 5,
        comments: 'sort-cat-utilities',
    });
    await createTransaction(request, {
        date: '2026-09-02',
        period: '202609',
        quincena: 'Q1',
        category_id: groceries.id,
        amount_cad: 5,
        comments: 'sort-cat-groceries',
    });
    await createTransaction(request, {
        date: '2026-09-03',
        period: '202609',
        quincena: 'Q1',
        category_id: transport.id,
        amount_cad: 5,
        comments: 'sort-cat-transport',
    });

    await openSeptember2026(page);

    await page.getByTestId('sort-header-category').click();
    await expect(page.getByTestId('sort-header-category')).toHaveAttribute(
        'aria-sort',
        'ascending',
    );

    await expect
        .poll(async () => {
            const cats = await rowCategories(page);
            return cats.map((text) => {
                if (text.includes('Groceries') || text.includes('MERCADO')) {
                    return 'Groceries';
                }
                if (
                    text.includes('Transportation') ||
                    text.includes('TRANSPORTES')
                ) {
                    return 'Transportation';
                }
                if (text.includes('Utilities') || text.includes('SERVICIOS')) {
                    return 'Utilities';
                }
                return text;
            });
        })
        .toEqual(['Groceries', 'Transportation', 'Utilities']);

    await page.screenshot({
        path: 'verification/test-122-sort-category/01-category-ascending.png',
        fullPage: true,
    });

    await page.getByTestId('sort-header-category').click();
    await expect(page.getByTestId('sort-header-category')).toHaveAttribute(
        'aria-sort',
        'descending',
    );

    await expect
        .poll(async () => {
            const cats = await rowCategories(page);
            return cats.map((text) => {
                if (text.includes('Groceries') || text.includes('MERCADO')) {
                    return 'Groceries';
                }
                if (
                    text.includes('Transportation') ||
                    text.includes('TRANSPORTES')
                ) {
                    return 'Transportation';
                }
                if (text.includes('Utilities') || text.includes('SERVICIOS')) {
                    return 'Utilities';
                }
                return text;
            });
        })
        .toEqual(['Utilities', 'Transportation', 'Groceries']);

    await page.screenshot({
        path: 'verification/test-122-sort-category/02-category-descending.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
