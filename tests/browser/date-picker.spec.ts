import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-158-date-picker';

for (const theme of ['light', 'dark'] as const) {
    test(`feature 158: date input calendar picker in ${theme} mode`, async ({
        page,
    }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));

        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);

        await page.getByTestId('nav-link-transactions').click();
        await page
            .getByRole('button', { name: 'Add Transaction', exact: true })
            .click();

        const dialog = page.getByTestId('transaction-form-dialog');
        await expect(dialog).toBeVisible();

        const dateField = page.getByTestId('transaction-date');
        const dateInput = page.getByTestId('transaction-date-input');
        await expect(dateField).toHaveAttribute(
            'data-date-format',
            'YYYY-MM-DD',
        );
        await expect(dialog.locator('label[for="date"]')).toContainText(
            'YYYY-MM-DD',
        );

        await page.screenshot({
            animations: 'disabled',
            path: `${evidence}/${theme}-01-form-before-picker.png`,
        });

        await expect(page.getByTestId('date-picker-calendar')).toHaveCount(0);

        // Clicking the date field opens the calendar picker.
        await dateInput.click();
        await expect(page.getByTestId('date-picker-calendar')).toBeVisible();
        await expect(page.getByTestId('date-picker-calendar')).toHaveAttribute(
            'data-date-format',
            'YYYY-MM-DD',
        );
        await expect(page.getByTestId('date-picker-format-hint')).toHaveText(
            'Format: YYYY-MM-DD',
        );
        await expect(page.getByTestId('date-picker-grid')).toBeVisible();

        await page.screenshot({
            animations: 'disabled',
            path: `${evidence}/${theme}-02-calendar-open.png`,
        });

        // Select a day from the visible month (default today / current view).
        const firstDay = page
            .locator('[data-testid^="date-picker-day-"]')
            .first();
        const selectedIso = await firstDay.getAttribute('data-testid');
        expect(selectedIso).toMatch(/^date-picker-day-\d{4}-\d{2}-\d{2}$/);
        const pickedDate = selectedIso!.replace('date-picker-day-', '');
        await firstDay.click();
        await expect(page.getByTestId('date-picker-calendar')).toHaveCount(0);
        await expect(dateInput).toHaveValue(pickedDate);
        await expect(page.getByTestId('transaction-period-input')).toHaveValue(
            pickedDate.slice(0, 4) + pickedDate.slice(5, 7),
        );

        // Typing YYYY-MM-DD also works.
        await dateInput.fill('2025-04-08');
        await expect(dateInput).toHaveValue('2025-04-08');
        await expect(page.getByTestId('transaction-period-input')).toHaveValue(
            '202504',
        );

        await page.screenshot({
            animations: 'disabled',
            path: `${evidence}/${theme}-03-after-type.png`,
        });

        // Calendar icon opens the picker for the typed date's month.
        await page.getByTestId('transaction-date-trigger').click();
        await expect(page.getByTestId('date-picker-calendar')).toBeVisible();
        await expect(page.getByTestId('date-picker-month-label')).toHaveText(
            'April 2025',
        );
        await page.getByTestId('date-picker-day-2025-04-18').click();
        await expect(page.getByTestId('date-picker-calendar')).toHaveCount(0);
        await expect(dateInput).toHaveValue('2025-04-18');

        await page.screenshot({
            animations: 'disabled',
            path: `${evidence}/${theme}-04-after-calendar-select.png`,
        });

        expect(errors).toEqual([]);
    });
}
