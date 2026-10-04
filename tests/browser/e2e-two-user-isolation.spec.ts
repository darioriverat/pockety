import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const password = 'Isolation-check-98!';

async function screenshot(page: Page, name: string) {
    await page.screenshot({
        path: `verification/e2e-two-user-isolation/${name}.png`,
        animations: 'disabled',
    });
}

async function register(page: Page, name: string, email: string) {
    await page.goto('/register');
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await screenshot(page, `${name}-register`);
    await page
        .getByRole('button', { name: 'Create account', exact: true })
        .click();
    await expect(page).toHaveURL(/\/dashboard$/);
}

async function logout(page: Page) {
    await page.locator('[data-test="sidebar-menu-button"]').click();
    await page.locator('[data-test="logout-button"]').click();
    await expect(page).toHaveURL(/\/$/);
}

async function login(page: Page, email: string) {
    await page.getByRole('link', { name: 'Log in', exact: true }).click();
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
}

async function navigate(page: Page, name: string, path: string) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
}

async function verifyTemplate(page: Page, name: string) {
    const response = page.waitForResponse((r) =>
        r.url().endsWith('/api/categories?include_inactive=1'),
    );
    await navigate(page, 'Categories', '/categories');
    const { data } = await (await response).json();
    expect(data.map((category: { code: string }) => category.code)).toEqual([
        ...Array.from(
            { length: 46 },
            (_, index) => `C${String(index + 1).padStart(3, '0')}`,
        ),
        'I01',
    ]);
    expect(
        data.filter((category: { is_active: boolean }) => category.is_active),
    ).toHaveLength(46);
    await expect(page.getByTestId('category-card-C040')).toContainText(
        'Retired',
    );
    await expect(page.getByTestId('category-card-C040')).toContainText(
        'retired_merged_into_C031',
    );
    await expect(page.locator('[data-testid^="category-card-"]')).toHaveCount(
        47,
    );
    // A preceding user's selected month must not leave this picker blank.
    await expect(page.getByTestId('period-selector')).toHaveText(/\w+ \d{4}/);
    await screenshot(page, `${name}-template`);
}

async function createCategory(page: Page, name: string, code: string) {
    await page.getByTestId('create-category-button').click();
    await page.getByTestId('category-name-input').fill(name);
    await page.getByTestId('kind-expense').check();
    await screenshot(page, `${code}-${name}-form`);
    const response = page.waitForResponse(
        (r) =>
            r.request().method() === 'POST' &&
            r.url().endsWith('/api/categories'),
    );
    await page.getByTestId('create-category-submit').click();
    const saved = await response;
    expect(saved.status()).toBe(201);
    const { data } = await saved.json();
    expect(data).toMatchObject({ code, name, is_active: true });
    await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
    const card = page.getByTestId(`category-card-${code}`);
    await expect(card).toContainText(name);
    await card.scrollIntoViewIfNeeded();
    await screenshot(page, `${code}-${name}-saved`);
    return data.id as number;
}

async function createTransaction(
    page: Page,
    name: string,
    date: string,
    amount: string,
) {
    await navigate(page, 'Transactions', '/transactions');
    await page
        .getByRole('button', { name: 'Add Transaction', exact: true })
        .click();
    await page.getByTestId('transaction-date-input').fill(date);
    await page.getByTestId('transaction-category-field').click();
    await page
        .getByRole('option', { name: `C047 - ${name} Groceries`, exact: true })
        .click();
    await page.getByTestId('transaction-amount-input').fill(amount);
    await page.getByLabel('Comments').fill(`${name} transaction`);
    await screenshot(page, `${name}-transaction-form`);
    const response = page.waitForResponse(
        (r) =>
            r.request().method() === 'POST' &&
            r.url().endsWith('/api/transactions'),
    );
    await page.getByTestId('transaction-form-submit').click();
    const saved = await response;
    expect(saved.status()).toBe(201);
    const { data } = await saved.json();
    await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);
    return data.id as number;
}

async function selectPeriod(
    page: Page,
    month: string,
    testId = 'period-selector',
) {
    await page.getByTestId(testId).click();
    await page.getByRole('option', { name: month, exact: true }).click();
    await expect(page.getByTestId(testId)).toContainText(month);
}

test('complete two-user isolation workflow - 25 steps', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    // Fresh UI registrations own all scenario data; never reset a shared database.
    const aliceEmail = `alice-${randomUUID()}@example.com`;
    const bobEmail = `bob-${randomUUID()}@example.com`;
    await register(page, 'Alice', aliceEmail);
    await logout(page);
    await login(page, aliceEmail);
    await verifyTemplate(page, 'Alice');
    const aliceCategoryId = await createCategory(
        page,
        'Alice Groceries',
        'C047',
    );
    // C047 belongs to both users. A second Alice-only code makes the 404 meaningful.
    await createCategory(page, 'Alice Private Category', 'C048');
    const aliceTransactionId = await createTransaction(
        page,
        'Alice',
        '2026-01-15',
        '125.50',
    );

    await navigate(page, 'Budgets', '/budgets');
    await selectPeriod(page, 'January 2026', 'page-period-selector');
    await page.getByTestId('budget-category-field').click();
    await page.getByTestId('budget-category-option-C047').click();
    await page.getByLabel('Budget Amount (CAD)').fill('200');
    await screenshot(page, 'Alice-budget-form');
    const budgetResponse = page.waitForResponse(
        (r) =>
            r.request().method() === 'POST' && r.url().endsWith('/api/budgets'),
    );
    await page.getByTestId('save-budget').click();
    expect((await budgetResponse).status()).toBe(200);
    await expect(page.getByTestId('budget-save-success')).toBeVisible();
    await expect(page.getByTestId('budget-total')).toHaveText('$200.00');
    await expect(page.getByTestId('actual-total')).toHaveText('$125.50');
    await screenshot(page, 'Alice-budget-saved');

    await navigate(page, 'Dashboard', '/dashboard');
    await selectPeriod(page, 'January 2026');
    await expect(page.getByTestId('dashboard-total-expenses')).toHaveText(
        '$125.50',
    );
    await expect(page.getByTestId('top-spending-row-C047')).toContainText(
        'Alice Groceries',
    );
    await expect(page.getByTestId('top-spending-amount-C047')).toContainText(
        '125.50',
    );
    await page.getByTestId('period-selector').click();
    await expect(
        page.getByRole('option', { name: 'January 2026', exact: true }),
    ).toBeVisible();
    await screenshot(page, 'Alice-dashboard-periods');
    await page.keyboard.press('Escape');
    await logout(page);

    await register(page, 'Bob', bobEmail);
    await logout(page);
    await login(page, bobEmail);
    await verifyTemplate(page, 'Bob');
    await expect(page.getByText('Alice Groceries')).toHaveCount(0);
    const bobCategoryId = await createCategory(page, 'Bob Groceries', 'C047');
    expect(bobCategoryId).not.toBe(aliceCategoryId);
    const bobTransactionId = await createTransaction(
        page,
        'Bob',
        '2026-03-16',
        '89.75',
    );
    await navigate(page, 'Dashboard', '/dashboard');
    await selectPeriod(page, 'March 2026');
    await expect(page.getByTestId('dashboard-total-expenses')).toHaveText(
        '$89.75',
    );
    await expect(page.getByTestId('top-spending-row-C047')).toContainText(
        'Bob Groceries',
    );
    await expect(page.getByTestId('top-spending-amount-C047')).toContainText(
        '89.75',
    );
    await expect(page.getByText('Alice Groceries')).toHaveCount(0);
    await expect(
        page.getByTestId(
            `recent-activity-item-transaction-${aliceTransactionId}`,
        ),
    ).toHaveCount(0);
    await page.getByTestId('period-selector').click();
    const options = page.getByRole('option');
    await expect(options.first()).toHaveText('March 2026');
    await expect(
        page.getByRole('option', { name: /January 2026|February 2026/ }),
    ).toHaveCount(0);
    await screenshot(page, 'Bob-dashboard-periods');
    await page.keyboard.press('Escape');

    // Read-only API checks share the actual UI session, never a second login context.
    const ownCategory = await page.request.get('/api/categories/C047');
    expect(ownCategory.status()).toBe(200);
    expect((await ownCategory.json()).data).toMatchObject({
        id: bobCategoryId,
        name: 'Bob Groceries',
    });
    expect((await page.request.get('/api/categories/C048')).status()).toBe(404);
    expect(
        (
            await page.request.get(`/api/transactions/${aliceTransactionId}`)
        ).status(),
    ).toBe(404);
    await navigate(page, 'Budgets', '/budgets');
    await expect(page.getByTestId('budget-total')).toHaveText('$0.00');
    await expect(page.getByTestId('budget-row-C047')).toContainText(
        'No budget',
    );
    // Check Alice's month explicitly even though Bob cannot select it in the UI.
    const januaryBudgets = await page.request.get(
        '/api/budgets/report?period=202601',
    );
    expect(januaryBudgets.status()).toBe(200);
    expect((await januaryBudgets.json()).meta.totals.budget_cad).toBe(0);
    await screenshot(page, 'Bob-budget-isolation');
    await navigate(page, 'Transactions', '/transactions');
    await selectPeriod(page, 'March 2026', 'page-period-selector');
    await expect(
        page.getByTestId(`transaction-row-${bobTransactionId}`),
    ).toContainText('Bob transaction');
    await expect(page.locator('[data-testid^="transaction-row-"]')).toHaveCount(
        1,
    );
    await screenshot(page, 'Bob-transaction-saved');
    await logout(page);

    await login(page, aliceEmail);
    await navigate(page, 'Categories', '/categories');
    await expect(page.getByTestId('category-card-C047')).toContainText(
        'Alice Groceries',
    );
    await expect(page.getByTestId('category-card-C048')).toContainText(
        'Alice Private Category',
    );
    await expect(page.getByText('Bob Groceries')).toHaveCount(0);
    await page.getByTestId('category-card-C047').scrollIntoViewIfNeeded();
    await screenshot(page, 'Alice-catalog-preserved');
    await navigate(page, 'Transactions', '/transactions');
    await selectPeriod(page, 'January 2026', 'page-period-selector');
    await expect(
        page.getByTestId(`transaction-row-${aliceTransactionId}`),
    ).toContainText('Alice transaction');
    await expect(
        page.getByTestId(`transaction-row-${bobTransactionId}`),
    ).toHaveCount(0);
    await screenshot(page, 'Alice-transaction-preserved');
    await selectPeriod(page, 'March 2026', 'page-period-selector');
    await expect(page.locator('[data-testid^="transaction-row-"]')).toHaveCount(
        0,
    );
    expect(
        (
            await page.request.get(`/api/transactions/${bobTransactionId}`)
        ).status(),
    ).toBe(404);
    await screenshot(page, 'Alice-cannot-see-Bob-transaction');
    await navigate(page, 'Budgets', '/budgets');
    await selectPeriod(page, 'January 2026', 'page-period-selector');
    await expect(page.getByTestId('budget-total')).toHaveText('$200.00');
    await expect(page.getByTestId('actual-total')).toHaveText('$125.50');
    await expect(page.getByTestId('budget-row-C047')).toContainText(
        'Alice Groceries',
    );
    await screenshot(page, 'Alice-budget-preserved');
    expect(errors).toEqual([]);
});
