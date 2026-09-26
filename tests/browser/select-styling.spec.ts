import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

for (const theme of ['light', 'dark'] as const) {
    test(`feature 159: dropdown/select inputs have clear arrow indicator and consistent styling in ${theme} mode`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));
        
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);
        
        // Navigate to transactions page and open add transaction form
        await page.getByTestId('nav-link-transactions').click();
        await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
        
        const dialog = page.getByTestId('transaction-form-dialog');
        await expect(dialog).toBeVisible();
        
        // Step 1 & 2: Take screenshot of form with select inputs
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-01-form-closed.png` 
        });
        
        // Step 3: Verify arrow indicator is visible on category select
        const categoryTrigger = dialog.locator('#category');
        await expect(categoryTrigger).toBeVisible();
        
        // Check that the arrow icon is present in the select trigger
        const categoryArrow = categoryTrigger.locator('svg.lucide-chevron-down');
        await expect(categoryArrow).toBeVisible();
        
        // Verify arrow is on the right side by checking the select trigger structure
        const categoryBox = await categoryTrigger.boundingBox();
        const arrowBox = await categoryArrow.boundingBox();
        expect(arrowBox).not.toBeNull();
        expect(categoryBox).not.toBeNull();
        expect(arrowBox!.x + arrowBox!.width).toBeGreaterThan(categoryBox!.x + categoryBox!.width - 20);
        
        // Step 4: Click select to open dropdown
        await categoryTrigger.click();
        await page.waitForTimeout(300); // Wait for animation
        
        // Take screenshot of opened dropdown
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-02-category-dropdown-open.png` 
        });
        
        // Step 5: Verify dropdown list is styled consistently
        const dropdownContent = page.locator('[data-slot="select-content"]');
        await expect(dropdownContent).toBeVisible();
        
        // Check dropdown has border and shadow
        const dropdownStyles = await dropdownContent.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                borderWidth: styles.borderWidth,
                borderStyle: styles.borderStyle,
                boxShadow: styles.boxShadow,
                borderRadius: styles.borderRadius,
            };
        });
        
        expect(dropdownStyles.borderWidth).not.toBe('0px');
        expect(dropdownStyles.borderStyle).toBe('solid');
        expect(dropdownStyles.boxShadow).not.toBe('none');
        expect(parseFloat(dropdownStyles.borderRadius)).toBeGreaterThan(0);
        
        // Step 6: Select an item and verify selected state is highlighted
        const option = page.getByRole('option', { name: /C001.*(Groceries|MERCADO)/i });
        await expect(option).toBeVisible();
        await option.click();
        
        await page.waitForTimeout(200); // Wait for selection
        
        // Verify the selected value is displayed in the trigger
        await expect(categoryTrigger).toContainText('C001');
        
        // Take screenshot after selection
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-03-after-selection.png` 
        });
        
        // Open dropdown again to verify selected item is highlighted
        await categoryTrigger.click();
        await page.waitForTimeout(300);
        
        // Take screenshot showing selected item with check mark
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-04-selected-item-highlighted.png` 
        });
        
        // Verify check icon is visible on selected item
        const selectedOption = page.getByRole('option', { name: /C001.*(Groceries|MERCADO)/i });
        const checkIcon = selectedOption.locator('svg.lucide-check');
        await expect(checkIcon).toBeVisible();
        
        // Test Account select as well
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        
        const accountTrigger = dialog.locator('#account');
        await accountTrigger.click();
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-05-account-dropdown.png` 
        });
        
        // Verify account dropdown also has proper styling
        await expect(dropdownContent).toBeVisible();
        const accountOption = page.getByRole('option').first();
        await accountOption.click();
        
        // Test Currency select
        await page.waitForTimeout(200);
        const currencyTrigger = dialog.locator('#currency');
        const currencyArrow = currencyTrigger.locator('svg.lucide-chevron-down');
        await expect(currencyArrow).toBeVisible();
        
        await currencyTrigger.click();
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-06-currency-dropdown.png` 
        });
        
        await expect(dropdownContent).toBeVisible();
        
        // Verify all select elements have consistent styling
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        
        // Take final screenshot showing all selects with their styling
        await page.screenshot({ 
            animations: 'disabled', 
            path: `verification/test-159-select-styling/${theme}-07-all-selects.png` 
        });
        
        // Close dialog
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        
        expect(errors).toEqual([]);
    });
}
