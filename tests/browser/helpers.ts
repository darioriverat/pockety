import { execFileSync } from 'node:child_process';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export interface ApiCategory {
    id: number;
    code: string;
    name: string;
    is_debt_category: boolean;
    is_income_category?: boolean;
}

export interface ApiTransaction {
    id: number;
    date: string;
    period: string;
    category_id: number;
    account_id: number | null;
    amount_cad: number | null;
    amount_usd: number | null;
    amount_cop: number | null;
    currency: 'CAD' | 'USD' | 'COP';
    amount: number;
    comments: string | null;
    is_recurring: boolean;
    is_credit: boolean;
    is_debt_payment: boolean;
    debt_component: 'principal' | 'interest' | null;
    category: ApiCategory;
}

export interface TransactionPayload {
    date: string;
    period: string;
    category_id: number;
    account_id?: number | null;
    amount_cad?: number | null;
    amount_usd?: number | null;
    amount_cop?: number | null;
    comments?: string | null;
    is_recurring?: boolean;
    is_credit?: boolean;
    is_debt_payment?: boolean;
    debt_component?: 'principal' | 'interest' | null;
}

/**
 * Insert a transaction so the period picker includes this month through the
 * current month. Call it before the page that renders the picker is loaded.
 */
export async function ensureTransactionInPeriod(
    request: APIRequestContext,
    period: string,
): Promise<void> {
    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const body = (await categoriesResponse.json()) as { data: ApiCategory[] };
    const category =
        body.data.find((item) => item.code === 'C001') ?? body.data[0];
    expect(category).toBeTruthy();

    const response = await request.post('/api/transactions', {
        data: {
            date: `${period.slice(0, 4)}-${period.slice(4, 6)}-01`,
            period,
            category_id: category.id,
            amount_cad: 0.01,
            comments: `period-range-anchor-${period}`,
        },
    });
    expect(response.ok()).toBeTruthy();
}

export function resetBrowserState(): void {
    try {
        execFileSync(
            'php',
            [
                'artisan',
                'migrate:fresh',
                '--seed',
                '--seeder=BrowserTestSeeder',
                '--force',
            ],
            {
                cwd: process.cwd(),
                stdio: 'inherit',
            },
        );
        return;
    } catch {
        // Host Playwright may not have PHP on PATH; fall back to app HTTP helpers.
    }

    const base =
        process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';

    execFileSync('curl', ['-sf', `${base}/dev/migrate-fresh`], {
        stdio: 'inherit',
    });
    execFileSync('curl', ['-sf', `${base}/dev/seed-browser`], {
        stdio: 'inherit',
    });
}

export function trackConsoleErrors(page: Page): string[] {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
        if (message.type() === 'error') {
            const text = message.text();
            // Filter out expected HTTP validation errors (4xx responses)
            if (!text.includes('status of 4')) {
                consoleErrors.push(text);
            }
        }
    });

    return consoleErrors;
}

export async function loginAsBrowserTestUser(
    page: Page,
    request?: APIRequestContext,
): Promise<void> {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    // Playwright's request fixture does not share the page cookie jar. Financial
    // APIs require session auth, so mirror login into the API context when given.
    if (request) {
        const response = await request.get('/dev/login-as-test-user?redirect=/dashboard');
        expect(response.status()).toBeLessThan(400);
    }
}
