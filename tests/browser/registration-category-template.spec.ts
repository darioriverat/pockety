import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('feature 71: registration preserves the retired C040 template category', async ({ page }) => {
    // Registration creates this scenario's entire catalog; no shared user or reset required.
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/register');
    await page.getByLabel('Name', { exact: true }).fill('Template Verification');
    await page.getByLabel('Email address').fill(`template-${randomUUID()}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('Template-check-71!');
    await page.getByLabel('Confirm password').fill('Template-check-71!');
    await page.screenshot({ path: 'verification/registration-template/register.png' });
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const catalogResponse = page.waitForResponse((response) =>
        response.url().includes('/api/categories?include_inactive=1'),
    );
    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    const response = await catalogResponse;
    expect(response.status()).toBe(200);
    const catalog = await response.json();
    expect(catalog.data).toHaveLength(47);
    expect(catalog.data).toContainEqual(expect.objectContaining({
        code: 'C040', is_active: false, status: 'retired_merged_into_C031',
    }));

    const retired = page.getByTestId('category-card-C040');
    await expect(retired).toContainText('Retired');
    await expect(retired).toContainText('retired_merged_into_C031');
    await expect(async () => {
        await retired.scrollIntoViewIfNeeded({ timeout: 2_000 });
        await retired.screenshot({
            path: 'verification/registration-template/retired-C040.png',
        });
    }).toPass();
    await page.screenshot({ path: 'verification/registration-template/categories.png' });

    const activeResponse = await page.request.get('/api/categories');
    expect(activeResponse.status()).toBe(200);
    const active = await activeResponse.json();
    expect(active.data).toHaveLength(46);
    expect(active.data).not.toContainEqual(expect.objectContaining({ code: 'C040' }));
    expect(errors).toEqual([]);
});
