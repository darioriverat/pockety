import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    ensureTransactionInPeriod,
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

function currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function previousPeriod(): string {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${previous.getFullYear()}${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function formatPeriod(period: string): string {
    const year = period.substring(0, 4);
    const month = Number.parseInt(period.substring(4, 6), 10);
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

function dateForPeriod(period: string, day: string): string {
    return `${period.substring(0, 4)}-${period.substring(4, 6)}-${day}`;
}

async function createAccount(
    request: APIRequestContext,
    name: string,
): Promise<{ id: number; name: string }> {
    const response = await request.post('/api/accounts', {
        data: { name, type: 'bank', primary_currency: 'CAD' },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
        data: { id: number; name: string };
    };
    return body.data;
}

async function getCategoryId(request: APIRequestContext): Promise<number> {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
        data: Array<{ id: number; code: string; name: string }>;
    };
    const category =
        body.data.find((item) => item.code === 'C001') ?? body.data[0];
    expect(category).toBeTruthy();
    return category.id;
}

async function createTransaction(
    request: APIRequestContext,
    accountId: number,
    categoryId: number,
    comments: string,
    period: string = currentPeriod(),
): Promise<void> {
    const response = await request.post('/api/transactions', {
        data: {
            date: dateForPeriod(period, '05'),
            period,
            category_id: categoryId,
            account_id: accountId,
            amount_cad: 25,
            comments,
        },
    });
    expect(response.ok()).toBeTruthy();
}

test.beforeEach(async ({ page, request }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page, request);
});

test('account filter row exposes an all-accounts option and filters the list', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categoryId = await getCategoryId(request);
    const alpha = await createAccount(request, 'Alpha Filter Bank');
    const beta = await createAccount(request, 'Beta Filter Bank');
    await createTransaction(request, alpha.id, categoryId, 'alpha-only');
    await createTransaction(request, beta.id, categoryId, 'beta-only');

    await page.goto('/transactions');
    await expect(
        page.getByRole('heading', { name: 'Transactions' }),
    ).toBeVisible();

    await expect(page.getByText('alpha-only')).toBeVisible();
    await expect(page.getByText('beta-only')).toBeVisible();

    // The filter select matches the rest of the row and offers all accounts.
    await expect(page.getByTestId('filter-account')).toBeVisible();
    await page.screenshot({
        path: 'verification/account-filter/01-filter-row.png',
        fullPage: true,
    });

    await page.getByTestId('filter-account').click();
    await expect(
        page.getByRole('option', { name: 'All Accounts' }),
    ).toBeVisible();
    await expect(
        page.getByRole('option', { name: 'Alpha Filter Bank' }),
    ).toBeVisible();
    await expect(
        page.getByRole('option', { name: 'Beta Filter Bank' }),
    ).toBeVisible();

    const accountRequest = page.waitForRequest((request) => {
        if (!request.url().includes('/api/transactions')) {
            return false;
        }
        if (request.method() !== 'GET') {
            return false;
        }
        return (
            new URL(request.url()).searchParams.get('account_id') ===
            String(alpha.id)
        );
    });

    await page.getByRole('option', { name: 'Alpha Filter Bank' }).click();
    await accountRequest;

    await expect(page.getByText('alpha-only')).toBeVisible();
    await expect(page.getByText('beta-only')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`account=${alpha.id}`));

    await page.screenshot({
        path: 'verification/account-filter/02-filtered-alpha.png',
        fullPage: true,
    });

    // Clearing filters drops the account filter and shows every account again.
    await page.getByRole('button', { name: /clear filters/i }).click();
    await expect(page.getByText('beta-only')).toBeVisible();
    await expect(page).not.toHaveURL(/account=/);
    await expect(page.getByTestId('filter-account')).toContainText(
        'All Accounts',
    );

    expect(consoleErrors).toEqual([]);
});

test('account query parameter applies on load and the account filter counts as active', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categoryId = await getCategoryId(request);
    const alpha = await createAccount(request, 'Alpha Query Bank');
    const beta = await createAccount(request, 'Beta Query Bank');
    const period = previousPeriod();
    await ensureTransactionInPeriod(request, period);
    await createTransaction(request, alpha.id, categoryId, 'alpha-query', period);
    await createTransaction(request, beta.id, categoryId, 'beta-query', period);

    await page.goto(`/transactions?account=${alpha.id}&period=${period}`);

    await expect(page.getByText('alpha-query')).toBeVisible();
    await expect(page.getByText('beta-query')).toHaveCount(0);
    await expect(page.getByTestId('filter-account')).toContainText(
        'Alpha Query Bank',
    );
    await expect(page.getByTestId('page-period-selector')).toContainText(
        formatPeriod(period),
    );
    await expect(
        page.getByRole('button', { name: /clear filters/i }),
    ).toBeVisible();

    await page.screenshot({
        path: 'verification/account-filter/03-query-param.png',
        fullPage: true,
    });

    // Reload restores the same filter state from the URL.
    await page.reload();
    await expect(page.getByText('alpha-query')).toBeVisible();
    await expect(page.getByText('beta-query')).toHaveCount(0);
    await expect(page.getByTestId('filter-account')).toContainText(
        'Alpha Query Bank',
    );

    // Changing the select writes the new account back to the URL.
    await page.getByTestId('filter-account').click();
    await page.getByRole('option', { name: 'Beta Query Bank' }).click();
    await expect(page).toHaveURL(new RegExp(`account=${beta.id}`));
    await expect(page.getByText('beta-query')).toBeVisible();
    await expect(page.getByText('alpha-query')).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
});
