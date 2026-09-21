import { execFileSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';

export interface ApiCategory {
    id: number;
    code: string;
    name_en: string;
    name_es: string;
    is_debt_category: boolean;
    is_income_category?: boolean;
}

export interface ApiTransaction {
    id: number;
    date: string;
    period: string;
    quincena: 'Q1' | 'Q2';
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
    debt_component: 'principal' | 'interest' | null;
    category: ApiCategory;
}

export interface TransactionPayload {
    date: string;
    period: string;
    quincena: 'Q1' | 'Q2';
    category_id: number;
    account_id?: number | null;
    amount_cad?: number | null;
    amount_usd?: number | null;
    amount_cop?: number | null;
    comments?: string | null;
    is_recurring?: boolean;
    is_credit?: boolean;
    debt_component?: 'principal' | 'interest' | null;
}

export function resetBrowserState(): void {
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

export async function loginAsBrowserTestUser(page: Page): Promise<void> {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
}
