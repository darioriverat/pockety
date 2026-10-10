import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';
import {
    loginAsBrowserTestUser,
    trackConsoleErrors,
    ensureExchangeRateForPeriod,
} from './helpers';

async function loginAsSecondBrowserUser(
    page: Page,
    request?: APIRequestContext,
): Promise<void> {
    await page.goto('/dev/login-as-second-user?redirect=/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    if (request) {
        const response = await request.get(
            '/dev/login-as-second-user?redirect=/dashboard',
        );
        expect(response.status()).toBeLessThan(400);
    }
}

async function logout(page: Page): Promise<void> {
    await page.goto('/logout').catch(() => undefined);
    // Fortify may use POST logout; fall back to clearing cookies via login page.
    await page.context().clearCookies();
}

test.describe('two-user ownership isolation', () => {
    test('categories and transactions stay private per user', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);

        await loginAsBrowserTestUser(page, request);
        await page.goto('/categories');
        await expect(
            page.getByRole('heading', { name: /categories/i }),
        ).toBeVisible();

        await page.getByTestId('create-category-button').click();
        await page
            .getByTestId('category-name-input')
            .fill('A Isolation Category');
        await page.getByTestId('kind-expense').click();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByText('A Isolation Category')).toBeVisible({
            timeout: 10000,
        });

        const categoriesA = await request.get('/api/categories');
        expect(categoriesA.ok()).toBeTruthy();
        const bodyA = (await categoriesA.json()) as {
            data: { id: number; name: string }[];
        };
        const namesA = bodyA.data.map((row) => row.name);
        expect(namesA).toContain('A Isolation Category');

        const categoryIdA = bodyA.data.find(
            (row) => row.name === 'A Isolation Category',
        )?.id;
        expect(categoryIdA).toBeTruthy();

        const txA = await request.post('/api/transactions', {
            data: {
                date: '2026-01-16',
                period: '202601',
                category_id: categoryIdA,
                amount_cad: 12.34,
                comments: 'A isolation txn',
            },
        });
        expect(txA.ok()).toBeTruthy();

        await page.screenshot({
            path: 'verification/user-isolation/user-a-categories.png',
            fullPage: true,
        });

        await logout(page);
        await loginAsSecondBrowserUser(page, request);

        await page.goto('/categories');
        await expect(
            page.getByRole('heading', { name: /categories/i }),
        ).toBeVisible();
        await expect(page.getByText('A Isolation Category')).toHaveCount(0);

        await page.getByTestId('create-category-button').click();
        await page
            .getByTestId('category-name-input')
            .fill('B Isolation Category');
        await page.getByTestId('kind-expense').click();
        await page.getByTestId('create-category-submit').click();
        await expect(page.getByText('B Isolation Category')).toBeVisible({
            timeout: 10000,
        });

        const categoriesB = await request.get('/api/categories');
        expect(categoriesB.ok()).toBeTruthy();
        const bodyB = (await categoriesB.json()) as {
            data: { id: number; name: string }[];
        };
        const namesB = bodyB.data.map((row) => row.name);
        expect(namesB).toContain('B Isolation Category');
        expect(namesB).not.toContain('A Isolation Category');

        const categoryIdB = bodyB.data.find(
            (row) => row.name === 'B Isolation Category',
        )?.id;
        expect(categoryIdB).toBeTruthy();

        const txB = await request.post('/api/transactions', {
            data: {
                date: '2026-01-17',
                period: '202601',
                category_id: categoryIdB,
                amount_cad: 56.78,
                comments: 'B isolation txn',
            },
        });
        expect(txB.ok()).toBeTruthy();

        const listB = await request.get('/api/transactions?period=202601');
        expect(listB.ok()).toBeTruthy();
        const commentsB = (
            (await listB.json()) as { data: { comments: string | null }[] }
        ).data.map((row) => row.comments);
        expect(commentsB).toContain('B isolation txn');
        expect(commentsB).not.toContain('A isolation txn');

        await page.screenshot({
            path: 'verification/user-isolation/user-b-categories.png',
            fullPage: true,
        });

        await logout(page);
        await loginAsBrowserTestUser(page, request);

        const categoriesAAgain = await request.get('/api/categories');
        const namesAAgain = (
            (await categoriesAAgain.json()) as { data: { name: string }[] }
        ).data.map((row) => row.name);
        expect(namesAAgain).toContain('A Isolation Category');
        expect(namesAAgain).not.toContain('B Isolation Category');

        const listA = await request.get('/api/transactions?period=202601');
        const commentsA = (
            (await listA.json()) as { data: { comments: string | null }[] }
        ).data.map((row) => row.comments);
        expect(commentsA).toContain('A isolation txn');
        expect(commentsA).not.toContain('B isolation txn');

        await page.goto('/categories');
        await expect(page.getByText('A Isolation Category')).toBeVisible();
        await expect(page.getByText('B Isolation Category')).toHaveCount(0);
        await page.screenshot({
            path: 'verification/user-isolation/user-a-categories-after.png',
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });

    test('accounts page and API hide the other user balances', async ({
        page,
        request,
    }) => {
        await loginAsBrowserTestUser(page, request);

        const createA = await request.post('/api/accounts', {
            data: {
                name: 'A Isolation Account',
                type: 'bank',
                primary_currency: 'CAD',
            },
        });
        expect(createA.ok()).toBeTruthy();
        const accountA = (await createA.json()) as { data: { id: number } };

        const balanceA = await request.post(
            `/api/accounts/${accountA.data.id}/balances`,
            {
                data: {
                    period: '202601',
                    recorded_balance_cad: 321,
                },
            },
        );
        expect(balanceA.ok()).toBeTruthy();

        await page.goto('/accounts');
        await expect(page.getByText('A Isolation Account')).toBeVisible({
            timeout: 10000,
        });
        await page.screenshot({
            path: 'verification/user-isolation/user-a-accounts.png',
            fullPage: true,
        });

        await logout(page);
        await loginAsSecondBrowserUser(page, request);

        const createB = await request.post('/api/accounts', {
            data: {
                name: 'B Isolation Account',
                type: 'bank',
                primary_currency: 'CAD',
            },
        });
        expect(createB.ok()).toBeTruthy();

        await page.goto('/accounts');
        await expect(page.getByText('B Isolation Account')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('A Isolation Account')).toHaveCount(0);
        await page.screenshot({
            path: 'verification/user-isolation/user-b-accounts.png',
            fullPage: true,
        });

        const listB = await request.get('/api/accounts');
        const namesB = (
            (await listB.json()) as { data: { name: string }[] }
        ).data.map((row) => row.name);
        expect(namesB).toContain('B Isolation Account');
        expect(namesB).not.toContain('A Isolation Account');
    });

    test('period balances and exchange rates can share the same period per user', async ({
        page,
        request,
    }) => {
        await loginAsBrowserTestUser(page, request);

        await ensureExchangeRateForPeriod(request, '202601', {
            copPerUsd: 4100,
            cadPerUsd: 0.71,
        });

        await page.goto('/exchange-rates');
        await expect(page.getByText(/4100|4,100|0\.71/i).first()).toBeVisible({
            timeout: 10000,
        });
        await page.screenshot({
            path: 'verification/user-isolation/user-a-exchange-rates.png',
            fullPage: true,
        });

        await logout(page);
        await loginAsSecondBrowserUser(page, request);

        await ensureExchangeRateForPeriod(request, '202601', {
            copPerUsd: 4600,
            cadPerUsd: 0.82,
        });

        const ratesB = await request.get('/api/exchange-rates');
        expect(ratesB.ok()).toBeTruthy();
        const dataB = (await ratesB.json()) as {
            data: { period: string; usd_cop: number }[];
        };
        expect(dataB.data).toHaveLength(1);
        expect(dataB.data[0].period).toBe('202601');
        expect(Number(dataB.data[0].usd_cop)).toBe(4600);

        await page.goto('/exchange-rates');
        await expect(page.getByText(/4600|4,600|0\.82/i).first()).toBeVisible({
            timeout: 10000,
        });
        await page.screenshot({
            path: 'verification/user-isolation/user-b-exchange-rates.png',
            fullPage: true,
        });
    });
});
