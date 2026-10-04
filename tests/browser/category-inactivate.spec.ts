import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Category Inactivate', () => {
    test('inactivate category via update endpoint', async ({ page }) => {
        await login(page);
        await page.goto('/categories');

        // Step 1: Create active category
        await page.getByTestId('create-category-button').click();
        await page.getByTestId('category-name-input').fill('Category to Inactivate');
        await page.getByTestId('kind-expense').check();
        await page.getByTestId('create-category-submit').click();

        // Wait for dialog to close and category to appear
        await expect(page.getByTestId('create-category-dialog')).toBeHidden();

        // Find the new category card (will be C047 as first custom category)
        const categoryCard = page.getByTestId('category-card-C047');
        await expect(categoryCard).toBeVisible();

        // Step 2: Verify is_active is true (no Retired badge initially)
        const retiredBadge = categoryCard.getByText('Retired');
        await expect(retiredBadge).not.toBeVisible();

        // Verify the card is not semi-transparent (active categories have full opacity)
        await expect(categoryCard).not.toHaveClass(/opacity-50/);

        // Step 3: PUT /api/categories/{code} with is_active false
        // Open edit dialog and uncheck Active
        await page.getByTestId('edit-category-C047').click();
        await expect(page.getByTestId('edit-category-dialog')).toBeVisible();

        // Verify Active checkbox is checked
        const activeCheckbox = page.getByTestId('edit-category-active');
        await expect(activeCheckbox).toBeChecked();

        // Uncheck the Active checkbox
        await activeCheckbox.click();
        await expect(activeCheckbox).not.toBeChecked();

        // Submit the form
        await page.getByTestId('edit-category-submit').click();

        // Step 4: Verify response 200 (dialog closes without error)
        await expect(page.getByTestId('edit-category-dialog')).toBeHidden();
        
        // Step 5: Verify data.is_active is false (Retired badge appears)
        await expect(categoryCard.getByText('Retired')).toBeVisible();

        // Step 6: Verify category still exists in database (visible on page with reduced opacity)
        await expect(categoryCard).toBeVisible();
        await expect(categoryCard).toHaveClass(/opacity-50/);

        // Verify name is still visible
        await expect(page.getByTestId('category-name-C047')).toContainText('Category to Inactivate');
    });
});
