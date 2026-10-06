import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const verificationDir = path.join(process.cwd(), 'verification', 'locale');

test.beforeAll(() => {
    resetBrowserState();
    fs.mkdirSync(verificationDir, { recursive: true });
});

async function openPreferences(page: import('@playwright/test').Page) {
    await page.goto('/preferences');
    await expect(page.getByTestId('preferences-form')).toBeVisible();
}

async function setLocale(
    page: import('@playwright/test').Page,
    locale: 'en' | 'es',
) {
    await openPreferences(page);
    await page.getByTestId('locale-select').click();
    await page.getByTestId(`locale-option-${locale}`).click();
    await page.getByTestId('preferences-save').click();
    await expect(page.getByTestId('preferences-success')).toBeVisible();
}

test('switching language to Spanish updates navigation and persists', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page, request);

    await setLocale(page, 'es');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByTestId('nav-link-dashboard')).toContainText('Panel');
    await expect(page.getByTestId('preferences-card')).toContainText(
        'Preferencias',
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('nav-link-accounts')).toContainText('Cuentas');
    await expect(page.getByTestId('nav-link-transactions')).toContainText(
        'Transacciones',
    );
    await page.screenshot({
        path: path.join(verificationDir, 'spanish-dashboard.png'),
        fullPage: true,
    });

    await page.goto('/accounts');
    await expect(page.getByTestId('nav-link-accounts')).toContainText('Cuentas');
    await page.screenshot({
        path: path.join(verificationDir, 'spanish-accounts.png'),
        fullPage: true,
    });

    await page.goto('/transactions');
    await expect(page.getByTestId('filter-account')).toBeVisible();
    await expect(page.getByLabel('Cuenta')).toBeVisible();
    await page.screenshot({
        path: path.join(verificationDir, 'spanish-transactions.png'),
        fullPage: true,
    });

    // Sign out and back in — locale must persist from the user record.
    await page.context().clearCookies();
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByTestId('nav-link-dashboard')).toContainText('Panel');

    expect(consoleErrors).toEqual([]);
});

test('switching language back to English restores English chrome', async ({
    page,
    request,
}) => {
    await loginAsBrowserTestUser(page, request);
    await setLocale(page, 'es');
    await setLocale(page, 'en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('nav-link-dashboard')).toContainText(
        'Dashboard',
    );
    await expect(page.getByTestId('preferences-card')).toContainText(
        'Preferences',
    );

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('nav-link-dashboard')).toContainText(
        'Dashboard',
    );

    await page.screenshot({
        path: path.join(verificationDir, 'english-preferences.png'),
        fullPage: true,
    });
});

test('user-entered account names are not translated', async ({
    page,
    request,
}) => {
    await loginAsBrowserTestUser(page, request);

    const create = await request.post('/api/accounts', {
        data: {
            name: 'Banco Demo Literal',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(create.ok()).toBeTruthy();

    await setLocale(page, 'es');
    await page.goto('/accounts');
    await expect(page.getByText('Banco Demo Literal')).toBeVisible();

    await setLocale(page, 'en');
    await page.goto('/accounts');
    await expect(page.getByText('Banco Demo Literal')).toBeVisible();
});
