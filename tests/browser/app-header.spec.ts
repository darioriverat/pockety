import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 139: application has a clean professional header with logo and navigation', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    const header = page.getByTestId('app-header');
    await expect(header).toBeVisible();

    const headerBrand = page.getByTestId('app-header-brand');
    await expect(headerBrand).toBeVisible();
    await expect(headerBrand).toContainText('Pockety');

    await expect(page.getByTestId('sidebar-brand')).toContainText('Pockety');
    await expect(page.getByTestId('app-brand-name')).toContainText('Pockety');

    const mainNav = page.getByTestId('main-navigation');
    await expect(mainNav).toBeVisible();
    await expect(page.getByTestId('nav-link-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-link-transactions')).toBeVisible();
    await expect(page.getByTestId('nav-link-categories')).toBeVisible();
    await expect(page.getByTestId('nav-link-accounts')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-139-header-branding/01-dashboard-header.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 140: navigation menu is responsive on mobile devices', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByTestId('app-header')).toBeVisible();
    await expect(page.getByTestId('app-header-brand')).toContainText('Pockety');

    const menuTrigger = page.getByTestId('nav-menu-trigger');
    await expect(menuTrigger).toBeVisible();

    // Desktop sidebar is hidden; open mobile sheet navigation
    await expect(page.getByTestId('nav-link-transactions')).toHaveCount(0);

    await page.screenshot({
        path: 'verification/test-140-mobile-nav/01-mobile-collapsed.png',
        fullPage: false,
    });

    await menuTrigger.click();

    const mobileNav = page.locator('[data-mobile="true"]');
    await expect(mobileNav).toBeVisible();
    await expect(page.getByTestId('nav-link-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-link-transactions')).toBeVisible();
    await expect(page.getByTestId('nav-link-categories')).toBeVisible();
    await expect(page.getByTestId('nav-link-accounts')).toBeVisible();
    await expect(page.getByTestId('sidebar-brand')).toContainText('Pockety');

    await page.screenshot({
        path: 'verification/test-140-mobile-nav/02-mobile-expanded.png',
        fullPage: false,
    });
    await mobileNav.screenshot({
        path: 'verification/test-140-mobile-nav/03-mobile-sheet.png',
    });

    expect(consoleErrors).toEqual([]);
});
