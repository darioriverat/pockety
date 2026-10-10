import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

for (const theme of ['light', 'dark'] as const) {
    test(`feature 161: tooltips provide helpful context on hover in ${theme} mode`, async ({
        page,
    }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));

        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);

        // Sidebar tooltips are shown when the sidebar is collapsed to icons.
        await page.getByTestId('nav-menu-trigger').click();
        await expect(
            page.locator('[data-slot="sidebar"][data-variant="inset"]'),
        ).toHaveAttribute('data-state', 'collapsed');

        // Collapsed sidebar items show their label in a tooltip.
        const dashboardLink = page.getByTestId('nav-link-dashboard');
        await expect(dashboardLink).toBeVisible();

        await page.screenshot({
            animations: 'disabled',
            path: `verification/test-161-tooltips/${theme}-01-before-hover.png`,
        });

        await dashboardLink.hover();
        await page.waitForTimeout(300);

        const tooltip = page.locator('[data-slot="tooltip-content"]');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Dashboard');

        await page.screenshot({
            animations: 'disabled',
            path: `verification/test-161-tooltips/${theme}-02-dashboard-tooltip.png`,
        });

        const tooltipBox = await tooltip.boundingBox();
        const triggerBox = await dashboardLink.boundingBox();

        expect(tooltipBox).not.toBeNull();
        expect(triggerBox).not.toBeNull();

        // Tooltip should be near but not overlapping the trigger
        // Check that tooltip is positioned above, below, left, or right of trigger
        const isAbove = tooltipBox!.y + tooltipBox!.height < triggerBox!.y;
        const isBelow = tooltipBox!.y > triggerBox!.y + triggerBox!.height;
        const isLeft = tooltipBox!.x + tooltipBox!.width < triggerBox!.x;
        const isRight = tooltipBox!.x > triggerBox!.x + triggerBox!.width;

        expect(isAbove || isBelow || isLeft || isRight).toBe(true);

        // Step 6: Verify tooltip disappears on mouse out
        await page.mouse.move(900, 300);
        await page.waitForTimeout(200);

        await expect(tooltip).not.toBeVisible();

        // Take screenshot after tooltip disappears
        await page.screenshot({
            animations: 'disabled',
            path: `verification/test-161-tooltips/${theme}-03-after-mouseout.png`,
        });

        const accountsLink = page.getByTestId('nav-link-accounts');
        await accountsLink.hover();
        await page.waitForTimeout(300);

        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Accounts');

        await page.screenshot({
            animations: 'disabled',
            path: `verification/test-161-tooltips/${theme}-04-accounts-tooltip.png`,
        });

        // Verify tooltip styling
        const tooltipStyles = await tooltip.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                borderRadius: styles.borderRadius,
                padding: styles.padding,
                fontSize: styles.fontSize,
                zIndex: styles.zIndex,
            };
        });

        // Should have proper styling
        expect(parseFloat(tooltipStyles.borderRadius)).toBeGreaterThan(0); // Rounded corners
        expect(parseFloat(tooltipStyles.zIndex)).toBeGreaterThanOrEqual(50); // High z-index
        expect(tooltipStyles.fontSize).toBe('12px'); // Small text (text-xs)
        expect(tooltipStyles.padding).toContain('12px'); // px-3 py-1.5

        // Test focus-based tooltip (keyboard accessibility)
        await page.mouse.move(900, 300);
        await page.waitForTimeout(200);
        await expect(tooltip).not.toBeVisible();

        // Focus the link with keyboard
        await dashboardLink.focus();
        await page.waitForTimeout(300);

        // Tooltip should appear on focus
        await expect(tooltip).toBeVisible();

        await page.screenshot({
            animations: 'disabled',
            path: `verification/test-161-tooltips/${theme}-05-focus-tooltip.png`,
        });

        // Blur to hide tooltip
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // Test variance tooltip on reconciliation page (from screenshot evidence)
        await page.goto('/reconciliation');
        await page.waitForTimeout(500);

        // Look for variance indicators
        const varianceIcon = page.locator('[data-testid*="variance"]').first();
        if (await varianceIcon.isVisible()) {
            await varianceIcon.hover();
            await page.waitForTimeout(300);

            // Check if tooltip appears
            const varianceTooltip = page.locator(
                '[data-slot="tooltip-content"]',
            );
            if (await varianceTooltip.isVisible()) {
                await page.screenshot({
                    animations: 'disabled',
                    path: `verification/test-161-tooltips/${theme}-06-variance-tooltip.png`,
                });
            }
        }

        expect(errors).toEqual([]);
    });
}
