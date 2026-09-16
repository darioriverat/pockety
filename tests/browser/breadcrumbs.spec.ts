import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-162-breadcrumbs',
);

test.beforeAll(() => {
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 162: breadcrumbs show current page location in navigation hierarchy', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsBrowserTestUser(page);

    // Ensure at least one account exists for the nested details page
    const listResponse = await page.request.get('/api/accounts');
    expect(listResponse.ok()).toBeTruthy();
    const listBody = await listResponse.json();
    let accountId: number | undefined = listBody?.data?.[0]?.id;

    if (!accountId) {
        const createResponse = await page.request.post('/api/accounts', {
            data: {
                name: 'Breadcrumb Test Account',
                type: 'bank',
                primary_currency: 'CAD',
            },
        });
        expect(createResponse.ok()).toBeTruthy();
        const created = await createResponse.json();
        accountId = created?.data?.id;
    }

    expect(accountId).toBeTruthy();

    // Step 1: Navigate to nested account details page
    await page.goto(`/accounts/${accountId}`);
    await expect(page.getByTestId('account-detail-page')).toBeVisible();

    // Step 2: Take screenshot of breadcrumb trail
    const trail = page.getByTestId('breadcrumb-trail');
    await expect(trail).toBeVisible();
    await page.screenshot({
        animations: 'disabled',
        path: path.join(verificationDir, '01-account-detail-breadcrumbs.png'),
        fullPage: false,
    });
    await trail.screenshot({
        animations: 'disabled',
        path: path.join(verificationDir, '02-breadcrumb-trail-closeup.png'),
    });

    // Step 3: Verify breadcrumb trail Home > Accounts > Details
    const breadcrumbs = page.getByTestId('breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    await expect(page.getByTestId('breadcrumb-link-0')).toHaveText('Home');
    await expect(page.getByTestId('breadcrumb-link-1')).toHaveText('Accounts');
    await expect(page.getByTestId('breadcrumb-current')).toHaveText('Details');

    // Step 4: Verify breadcrumbs are clickable to navigate back
    await page.getByTestId('breadcrumb-link-1').click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();

    await page.goto(`/accounts/${accountId}`);
    await expect(page.getByTestId('breadcrumb-current')).toHaveText('Details');
    await page.getByTestId('breadcrumb-link-0').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Also verify category nested trail
    await page.goto('/categories/C001');
    await expect(page.getByTestId('breadcrumb-link-0')).toHaveText('Home');
    await expect(page.getByTestId('breadcrumb-link-1')).toHaveText('Categories');
    await expect(page.getByTestId('breadcrumb-current')).toHaveText('Details');
    await page.screenshot({
        animations: 'disabled',
        path: path.join(verificationDir, '03-category-detail-breadcrumbs.png'),
        fullPage: false,
    });

    // Step 5: Verify current page is highlighted (aria-current + not a link)
    const current = page.getByTestId('breadcrumb-current');
    await expect(current.locator('[aria-current="page"]')).toBeVisible();
    await expect(
        page.getByTestId('breadcrumbs').getByRole('link', { name: 'Details' }),
    ).toHaveCount(0);

    expect(errors).toEqual([]);
});
