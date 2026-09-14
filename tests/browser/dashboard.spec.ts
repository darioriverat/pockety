import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 1: user can access the application dashboard', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await loginAsBrowserTestUser(page);
    await expect(
        page.getByRole('link', { name: 'Dashboard' }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
