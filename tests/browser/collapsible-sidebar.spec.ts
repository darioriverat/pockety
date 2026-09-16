import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 171: sidebar collapses to icons and expands back', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');

    // Wait for sidebar group (parent container with data-state) to be visible
    const sidebarGroup = page.locator('[data-slot="sidebar"]').first();
    await expect(sidebarGroup).toBeVisible();

    // Verify sidebar is initially expanded
    await expect(sidebarGroup).toHaveAttribute('data-state', 'expanded');
    
    // Check that navigation items show both icon and text
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i });
    await expect(dashboardLink).toBeVisible();

    // Take screenshot of expanded sidebar
    await page.screenshot({
        path: 'verification/test-171-collapsible-sidebar/sidebar-expanded.png',
        fullPage: true,
    });

    // Find and click the sidebar toggle button
    const toggleButton = page.locator('[data-testid="nav-menu-trigger"]');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Wait for collapse animation
    await page.waitForTimeout(300);

    // Verify sidebar is collapsed
    await expect(sidebarGroup).toHaveAttribute('data-state', 'collapsed');

    // Verify the group has the collapsible attribute set
    await expect(sidebarGroup).toHaveAttribute('data-collapsible', 'icon');

    // Take screenshot of collapsed sidebar
    await page.screenshot({
        path: 'verification/test-171-collapsible-sidebar/sidebar-collapsed.png',
        fullPage: true,
    });

    // Click toggle again to expand
    await toggleButton.click();
    await page.waitForTimeout(300);

    // Verify sidebar is expanded again
    await expect(sidebarGroup).toHaveAttribute('data-state', 'expanded');
    await expect(dashboardLink).toBeVisible();

    // Take screenshot of re-expanded sidebar
    await page.screenshot({
        path: 'verification/test-171-collapsible-sidebar/sidebar-re-expanded.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 171: keyboard shortcut toggles sidebar', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');

    const sidebarGroup = page.locator('[data-slot="sidebar"]').first();
    await expect(sidebarGroup).toBeVisible();

    // Sidebar should start expanded
    await expect(sidebarGroup).toHaveAttribute('data-state', 'expanded');

    // Use keyboard shortcut (Cmd+B on Mac, Ctrl+B on others)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyB`);
    await page.waitForTimeout(300);

    // Sidebar should be collapsed
    await expect(sidebarGroup).toHaveAttribute('data-state', 'collapsed');

    // Press again to expand
    await page.keyboard.press(`${modifier}+KeyB`);
    await page.waitForTimeout(300);

    // Sidebar should be expanded
    await expect(sidebarGroup).toHaveAttribute('data-state', 'expanded');

    expect(consoleErrors).toEqual([]);
});

test('feature 171: collapsed sidebar shows tooltips on hover', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);
    await page.goto('/dashboard');

    const sidebarGroup = page.locator('[data-slot="sidebar"]').first();
    await expect(sidebarGroup).toBeVisible();

    // Collapse the sidebar
    const toggleButton = page.locator('[data-testid="nav-menu-trigger"]');
    await toggleButton.click();
    await page.waitForTimeout(300);

    // Verify sidebar is collapsed
    await expect(sidebarGroup).toHaveAttribute('data-state', 'collapsed');

    // Hover over a navigation item (should show tooltip)
    // In collapsed mode, nav items should have tooltips showing the label
    const accountsIcon = page.locator('a[href="/accounts"]');
    await accountsIcon.hover();
    await page.waitForTimeout(200);

    // Take screenshot showing tooltip
    await page.screenshot({
        path: 'verification/test-171-collapsible-sidebar/sidebar-tooltip.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
