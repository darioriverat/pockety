import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('complete category workflow: create, use, edit, inactivate, delete prevention', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        // Chromium logs the intentional delete rejection as a resource error.
        if (
            message.type() === 'error' &&
            !message.text().includes('status of 422')
        ) {
            errors.push(message.text());
        }
    });
    const screenshot = async (name: string) => {
        await page.screenshot({
            path: `verification/category-lifecycle/${name}.png`,
            animations: 'disabled',
        });
    };

    // Each run owns its data. Never reset the application's database.
    await page.goto('/register');
    await page
        .getByLabel('Name', { exact: true })
        .fill('Category Lifecycle Test');
    await page
        .getByLabel('Email address')
        .fill(`lifecycle-${randomUUID()}@example.com`);
    await page
        .getByLabel('Password', { exact: true })
        .fill('Lifecycle-check-97!');
    await page.getByLabel('Confirm password').fill('Lifecycle-check-97!');
    await page
        .getByRole('button', { name: 'Create account', exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    await expect(page.getByTestId('category-card-C001')).toBeVisible();
    await screenshot('01-categories');
    await page.getByTestId('create-category-button').click();
    await page.getByTestId('category-name-input').fill('Test Category E2E');
    await page.getByTestId('kind-expense').check();
    await screenshot('02-create');
    const createResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith('/api/categories'),
    );
    await page.getByTestId('create-category-submit').click();
    const created = await createResponse;
    expect(created.status()).toBe(201);
    const { data: category } = await created.json();
    expect(category).toMatchObject({
        code: 'C047',
        name: 'Test Category E2E',
        is_active: true,
    });
    await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
    const card = page.getByTestId('category-card-C047');
    await expect(card).toContainText('Test Category E2E');
    await card.scrollIntoViewIfNeeded();
    await screenshot('03-created');

    await page.getByRole('link', { name: 'Transactions', exact: true }).click();
    await page
        .getByRole('button', { name: 'Add Transaction', exact: true })
        .click();
    await page.getByTestId('transaction-date-input').fill('2026-01-15');
    await expect(page.getByTestId('transaction-period-input')).toHaveValue(
        '202601',
    );
    await page.getByTestId('transaction-category-field').click();
    await page
        .getByRole('option', { name: 'C047 - Test Category E2E', exact: true })
        .click();
    await page.getByTestId('transaction-amount-input').fill('150.50');
    await page.getByLabel('Comments').fill('E2E test transaction');
    await screenshot('04-transaction-form');
    const transactionResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith('/api/transactions'),
    );
    await page.getByTestId('transaction-form-submit').click();
    const saved = await transactionResponse;
    expect(saved.status()).toBe(201);
    const { data: transaction } = await saved.json();
    expect(transaction.category_id).toBe(category.id);
    await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);
    await page.reload();
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: /january 2026/i }).click();
    const row = page.getByTestId(`transaction-row-${transaction.id}`);
    await expect(row).toBeVisible();
    await screenshot('05-transaction-saved');

    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    await page.getByTestId('edit-category-C047').click();
    await expect(page.getByTestId('edit-kind-locked-message')).toBeVisible();
    for (const kind of ['expense', 'debt', 'income']) {
        await expect(page.getByTestId(`edit-kind-${kind}`)).toBeDisabled();
    }
    await page.getByTestId('edit-category-name-input').fill('Renamed Category');
    await screenshot('06-rename-locked');
    await page.getByTestId('edit-category-submit').click();
    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await expect(card).toContainText('Renamed Category');
    await card.scrollIntoViewIfNeeded();
    await screenshot('07-renamed');

    await page.getByTestId('edit-category-C047').click();
    await expect(page.getByTestId('edit-category-active')).toBeChecked();
    await page.getByTestId('edit-category-active').uncheck();
    await screenshot('08-inactivate');
    await page.getByTestId('edit-category-submit').click();
    await expect(page.getByTestId('edit-category-dialog')).toHaveCount(0);
    await expect(card.getByText('Retired', { exact: true })).toBeVisible();
    await expect(card).toHaveClass(/opacity-50/);
    await card.scrollIntoViewIfNeeded();
    await screenshot('09-retired');

    await page.getByRole('link', { name: 'Transactions', exact: true }).click();
    await page
        .getByRole('button', { name: 'Add Transaction', exact: true })
        .click();
    await page.getByTestId('transaction-category-field').click();
    await expect(page.getByRole('option').first()).toBeVisible();
    await expect(
        page.getByRole('option', { name: /C047|Renamed Category/ }),
    ).toHaveCount(0);
    await screenshot('10-picker-exclusion');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: /january 2026/i }).click();
    await expect(row).toBeVisible();
    await expect(
        page.getByTestId(`transaction-category-${transaction.id}`),
    ).toContainText('C047 - Renamed Category');
    await screenshot('11-historical-transaction');

    await page
        .getByRole('link', { name: 'Category Actuals', exact: true })
        .click();
    await expect(page).toHaveURL(/\/category-actuals$/);
    await expect(page.getByTestId('category-actuals-heading')).toBeVisible();
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: /january 2026/i }).click();
    await expect(page.getByTestId('category-actual-row-C047')).toContainText(
        'Renamed Category',
    );
    await expect(page.getByTestId('category-actual-amount-C047')).toContainText(
        '150.50',
    );
    await expect(page.getByTestId('category-actual-tx-C047')).toHaveText('1');
    await screenshot('12-report');

    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    await card.scrollIntoViewIfNeeded();
    const messages: string[] = [];
    page.on('dialog', async (dialog) => {
        messages.push(dialog.message());
        await dialog.accept();
    });
    const deleteResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'DELETE' &&
            response.url().endsWith('/api/categories/C047'),
    );
    await card.getByRole('button', { name: /delete c047/i }).click();
    const rejected = await deleteResponse;
    expect(rejected.status()).toBe(422);
    expect(await rejected.json()).toMatchObject({
        has_transactions: true,
        message:
            'This category has associated transactions and cannot be deleted',
    });
    await expect.poll(() => messages.length).toBe(2);
    expect(messages[0]).toContain('C047');
    expect(messages[1]).toBe(
        'This category has associated transactions and cannot be deleted',
    );
    await expect(card).toContainText('Renamed Category');
    await screenshot('13-delete-rejected');
    await page.reload();
    await expect(card).toContainText('Renamed Category');
    await expect(card.getByText('Retired', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
});
