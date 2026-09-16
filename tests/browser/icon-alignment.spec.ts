import { expect, test, type Page } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-168-icon-alignment',
);

test.beforeAll(() => {
    fs.mkdirSync(verificationDir, { recursive: true });
});

async function applyTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate((mode) => {
        localStorage.setItem('appearance', mode);
        document.cookie = `appearance=${mode};path=/;max-age=31536000;SameSite=Lax`;
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.style.colorScheme = mode;
    }, theme);
}

type IconSample = {
    fill: string;
    width: number;
    height: number;
    aligned: boolean;
    midDelta: number;
};

async function measureIconWithText(
    page: Page,
    containerSelector: string,
): Promise<IconSample> {
    return page.evaluate((sel) => {
        const root = document.querySelector(sel) as HTMLElement | null;
        if (!root) {
            throw new Error(`Container not found: ${sel}`);
        }
        const svg = root.querySelector('svg');
        if (!svg) {
            throw new Error(`No svg in ${sel}`);
        }
        const textEl =
            (root.querySelector('span, h1, h2, h3, p, a') as HTMLElement | null) ||
            root;
        const svgRect = svg.getBoundingClientRect();
        const textRect = textEl.getBoundingClientRect();
        const svgMid = svgRect.top + svgRect.height / 2;
        const textMid = textRect.top + textRect.height / 2;
        const midDelta = Math.abs(svgMid - textMid);
        const style = getComputedStyle(svg);
        return {
            fill: style.fill,
            width: Math.round(svgRect.width),
            height: Math.round(svgRect.height),
            aligned: midDelta <= 4,
            midDelta,
        };
    }, containerSelector);
}

for (const theme of ['light', 'dark'] as const) {
    test(`nav and dashboard icons are outline and aligned (${theme})`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);
        await applyTheme(page, theme);

        await page.goto('/dashboard');
        await expect(page.getByTestId('main-navigation')).toBeVisible({
            timeout: 15000,
        });

        const navLink = page.getByTestId('nav-link-dashboard');
        await expect(navLink).toBeVisible();

        const navIcon = await measureIconWithText(
            page,
            '[data-testid="nav-link-dashboard"]',
        );
        expect(navIcon.width).toBeGreaterThanOrEqual(14);
        expect(navIcon.width).toBeLessThanOrEqual(20);
        expect(navIcon.height).toBe(navIcon.width);
        expect(navIcon.aligned).toBe(true);
        expect(navIcon.fill === 'none' || navIcon.fill === 'rgba(0, 0, 0, 0)').toBe(
            true,
        );

        const card = page.getByTestId('dashboard-card-income');
        await expect(card).toBeVisible();
        const cardIcon = await page.evaluate(() => {
            const el = document.querySelector(
                '[data-testid="dashboard-card-income"] [data-slot="icon"]',
            ) as SVGElement | null;
            if (!el) throw new Error('summary card icon missing');
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
                width: Math.round(rect.width),
                fill: style.fill,
                hasSlot: el.getAttribute('data-slot') === 'icon',
            };
        });
        expect(cardIcon.hasSlot).toBe(true);
        expect(cardIcon.width).toBe(16);
        expect(
            cardIcon.fill === 'none' || cardIcon.fill === 'rgba(0, 0, 0, 0)',
        ).toBe(true);

        await page.screenshot({
            path: path.join(verificationDir, `dashboard-icons-${theme}.png`),
            animations: 'disabled',
        });

        expect(consoleErrors).toEqual([]);
    });
}

test('accounts page icons align with titles and button labels', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await applyTheme(page, 'light');

    await page.goto('/accounts');
    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 15000 });

    const addButton = page.getByRole('button', { name: /add account/i }).first();
    await expect(addButton).toBeVisible();
    const buttonIcon = await addButton.evaluate((btn) => {
        const svg = btn.querySelector('svg');
        if (!svg) throw new Error('Add Account button icon missing');
        const svgRect = svg.getBoundingClientRect();
        const textRect = btn.getBoundingClientRect();
        const midDelta = Math.abs(
            svgRect.top +
                svgRect.height / 2 -
                (textRect.top + textRect.height / 2),
        );
        return {
            width: Math.round(svgRect.width),
            midDelta,
            fill: getComputedStyle(svg).fill,
            aligned: midDelta <= 4,
        };
    });
    expect(buttonIcon.aligned).toBe(true);
    expect(buttonIcon.width).toBe(16);
    expect(
        buttonIcon.fill === 'none' || buttonIcon.fill === 'rgba(0, 0, 0, 0)',
    ).toBe(true);

    // Empty-state decorative icon should be outline + consistent size
    const emptyIcon = page.getByTestId('empty-state-icon');
    if (await emptyIcon.count()) {
        const emptyMetrics = await emptyIcon.evaluate((el) => {
            const svg = el.querySelector('svg');
            if (!svg) throw new Error('empty state svg missing');
            const rect = svg.getBoundingClientRect();
            return {
                width: Math.round(rect.width),
                fill: getComputedStyle(svg).fill,
                hasSlot: svg.getAttribute('data-slot') === 'icon',
            };
        });
        expect(emptyMetrics.hasSlot).toBe(true);
        expect(emptyMetrics.width).toBe(32);
        expect(
            emptyMetrics.fill === 'none' ||
                emptyMetrics.fill === 'rgba(0, 0, 0, 0)',
        ).toBe(true);
    }

    // Create an account so we can assert card-title icon alignment
    await addButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Account Name').fill('Icon Align Checking');
    await page.getByLabel('Account Type').click();
    await page.getByRole('option', { name: 'Bank Account' }).click();
    await page.getByLabel('Primary Currency').click();
    await page.getByRole('option', { name: 'CAD' }).click();
    await page.getByRole('button', { name: 'Save Account' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    const accountTitle = page.getByTestId('account-card-title').first();
    await expect(accountTitle).toBeVisible();
    const titleRow = await page.evaluate(() => {
        const title = document.querySelector(
            '[data-testid="account-card-title"]',
        ) as HTMLElement | null;
        if (!title) throw new Error('account title missing');
        const row = title.parentElement as HTMLElement;
        const svg = row.querySelector('svg');
        if (!svg) throw new Error('account title icon missing');
        const svgRect = svg.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const midDelta = Math.abs(
            svgRect.top +
                svgRect.height / 2 -
                (titleRect.top + titleRect.height / 2),
        );
        return {
            width: Math.round(svgRect.width),
            midDelta,
            fill: getComputedStyle(svg).fill,
        };
    });
    expect(titleRow.width).toBe(16);
    expect(titleRow.midDelta).toBeLessThanOrEqual(4);
    expect(titleRow.fill === 'none' || titleRow.fill === 'rgba(0, 0, 0, 0)').toBe(
        true,
    );

    await page.screenshot({
        path: path.join(verificationDir, 'accounts-icons.png'),
        animations: 'disabled',
    });

    expect(consoleErrors).toEqual([]);
});

test('reconciliation page title leading icon uses consistent size', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await applyTheme(page, 'light');

    await page.goto('/reconciliation');
    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 15000 });

    const leading = await page.evaluate(() => {
        const wrap = document.querySelector(
            '[data-slot="page-title-leading"]',
        ) as HTMLElement | null;
        if (!wrap) throw new Error('page title leading missing');
        const svg = wrap.querySelector('svg');
        if (!svg) throw new Error('leading icon missing');
        const title = document.querySelector(
            '[data-testid="page-title"]',
        ) as HTMLElement;
        const svgRect = svg.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const midDelta = Math.abs(
            svgRect.top +
                svgRect.height / 2 -
                (titleRect.top + titleRect.height / 2),
        );
        return {
            width: Math.round(svgRect.width),
            midDelta,
            fill: getComputedStyle(svg).fill,
        };
    });

    expect(leading.width).toBe(28);
    expect(leading.midDelta).toBeLessThanOrEqual(6);
    expect(leading.fill === 'none' || leading.fill === 'rgba(0, 0, 0, 0)').toBe(
        true,
    );

    await page.screenshot({
        path: path.join(verificationDir, 'reconciliation-title-icon.png'),
        animations: 'disabled',
    });

    expect(consoleErrors).toEqual([]);
});
