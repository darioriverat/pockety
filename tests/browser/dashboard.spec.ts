import { expect, test } from '@playwright/test';

test('feature 1: user can access the application dashboard', async ({
    page,
}) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });

    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
        page.getByRole('link', { name: 'Dashboard' }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
