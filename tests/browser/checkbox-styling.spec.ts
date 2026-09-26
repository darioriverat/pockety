import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

for (const theme of ['light', 'dark'] as const) {
    test(`feature 160: checkbox inputs have custom styling in ${theme} mode`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);
        
        // Navigate to transactions page and open add transaction form
        await page.getByTestId('nav-link-transactions').click();
        await expect(page).toHaveURL(/\/transactions/);
        const addButton = page.getByRole('button', {
            name: 'Add Transaction',
            exact: true,
        });
        await expect(addButton).toBeVisible();
        await addButton.click();
        
        const dialog = page.getByTestId('transaction-form-dialog');
        await expect(dialog).toBeVisible();
        
        // Step 1 & 2: Take screenshot of form with checkbox
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-160-checkbox-styling/${theme}-01-checkbox-unchecked.png` 
        });
        
        // Step 3: Verify checkbox uses custom styling (not browser default)
        const checkbox = dialog.getByRole('checkbox', {
            name: 'Recurring transaction',
        });
        await expect(checkbox).toBeVisible();
        
        // Radix checkbox root carries data-slot, not its wrapper
        await expect(checkbox).toHaveAttribute('data-slot', 'checkbox');
        
        // Verify custom styling classes are present
        const checkboxClasses = await checkbox.evaluate((el) => el.className);
        expect(checkboxClasses).toContain('rounded');
        expect(checkboxClasses).toContain('border');
        expect(checkboxClasses).toContain('shadow');
        
        // Verify it's not a default HTML checkbox
        const checkboxType = await checkbox.getAttribute('type');
        expect(checkboxType).not.toBe('checkbox'); // Radix UI uses button, not input type=checkbox
        
        // Step 4: Verify checked state is visually clear
        const label = dialog.locator('label[for="is_recurring"]');
        await expect(label).toBeVisible();
        await expect(label).toContainText('Recurring transaction');
        
        // Step 5: Verify label is clickable - click the label to check the checkbox
        await label.click();
        await page.waitForTimeout(200); // Wait for animation
        
        // Take screenshot of checked state
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-160-checkbox-styling/${theme}-02-checkbox-checked.png` 
        });
        
        // Verify checkbox is now checked
        await expect(checkbox).toHaveAttribute('data-state', 'checked');
        
        // Verify check icon is visible when checked
        const checkIcon = checkbox.locator('svg.lucide-check');
        await expect(checkIcon).toBeVisible();
        
        // Test unchecking by clicking the checkbox itself
        await checkbox.click();
        await page.waitForTimeout(200);
        
        // Verify checkbox is now unchecked
        await expect(checkbox).toHaveAttribute('data-state', 'unchecked');
        
        // Take screenshot showing interaction
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-160-checkbox-styling/${theme}-03-checkbox-interaction.png` 
        });
        
        // Test focus state
        await checkbox.focus();
        await page.waitForTimeout(100);
        
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-160-checkbox-styling/${theme}-04-checkbox-focused.png` 
        });
        
        // Verify focus ring is visible
        const focusStyles = await checkbox.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                boxShadow: styles.boxShadow,
                outline: styles.outline,
            };
        });
        
        // Should have some kind of focus indicator (ring or outline)
        expect(focusStyles.boxShadow !== 'none' || focusStyles.outline !== 'none').toBe(true);
        
        // Test keyboard interaction - space bar should toggle
        await checkbox.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);
        
        await expect(checkbox).toHaveAttribute('data-state', 'checked');
        
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-160-checkbox-styling/${theme}-05-checkbox-keyboard-toggle.png` 
        });
        
        // Test accessibility
        const checkboxRole = await checkbox.getAttribute('role');
        expect(checkboxRole).toBe('checkbox');
        
        const ariaChecked = await checkbox.getAttribute('aria-checked');
        expect(ariaChecked).toBe('true');
        
        // Close dialog
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        
        expect(errors).toEqual([]);
    });
}
