import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser } from './helpers';

test('removed GitHub and starter-kit links are absent from sidebar, header, and footer', async ({
    page,
}) => {
    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Sidebar (which previously held the Repository and Documentation items)
    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(
        sidebar.getByRole('link', { name: /repository/i }),
    ).toHaveCount(0);
    await expect(
        sidebar.getByRole('link', { name: /documentation/i }),
    ).toHaveCount(0);

    // Footer (which previously held the same two links)
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(
        footer.getByRole('link', { name: /repository/i }),
    ).toHaveCount(0);
    await expect(
        footer.getByRole('link', { name: /documentation/i }),
    ).toHaveCount(0);

    // No forbidden href anywhere on the page (header included)
    await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
    await expect(
        page.locator('a[href*="laravel.com/docs/starter-kits"]'),
    ).toHaveCount(0);

    // The sidebar footer still renders the user menu rather than a blank section
    await expect(sidebar).toBeVisible();
});
