import { expect, test, type Page } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-167-link-styling',
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

type LinkStyles = {
    color: string;
    bodyColor: string;
    textDecorationLine: string;
    colorsDifferFromBody: boolean;
    hasUnderline: boolean;
    linkToken: string;
    hoverToken: string;
    visitedToken: string;
    tokensDiffer: boolean;
};

async function measureContentLink(
    page: Page,
    selector: string,
): Promise<LinkStyles> {
    return page.evaluate((sel) => {
        const link = document.querySelector(sel) as HTMLElement | null;
        if (!link) {
            throw new Error(`Link not found: ${sel}`);
        }
        const base = getComputedStyle(link);
        const bodyStyle = getComputedStyle(document.body);
        const root = getComputedStyle(document.documentElement);
        const linkToken = root.getPropertyValue('--link').trim();
        const hoverToken = root.getPropertyValue('--link-hover').trim();
        const visitedToken = root.getPropertyValue('--link-visited').trim();

        return {
            color: base.color,
            bodyColor: bodyStyle.color,
            textDecorationLine: base.textDecorationLine,
            colorsDifferFromBody: base.color !== bodyStyle.color,
            hasUnderline: base.textDecorationLine.includes('underline'),
            linkToken,
            hoverToken,
            visitedToken,
            tokensDiffer:
                linkToken.length > 0 &&
                hoverToken.length > 0 &&
                visitedToken.length > 0 &&
                linkToken !== hoverToken &&
                linkToken !== visitedToken,
        };
    }, selector);
}

for (const theme of ['light', 'dark'] as const) {
    test(`content links are distinct from body text (${theme})`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);
        await applyTheme(page, theme);

        await page.goto('/categories');
        const link = page.getByTestId('category-link-C001').first();
        await expect(link).toBeVisible({ timeout: 15000 });

        const styles = await measureContentLink(
            page,
            '[data-testid="category-link-C001"]',
        );

        expect(styles.colorsDifferFromBody).toBe(true);
        expect(styles.hasUnderline).toBe(true);
        expect(styles.tokensDiffer).toBe(true);

        await page.screenshot({
            path: path.join(verificationDir, `categories-links-${theme}.png`),
            animations: 'disabled',
        });

        await link.hover();
        await page.screenshot({
            path: path.join(
                verificationDir,
                `categories-links-hover-${theme}.png`,
            ),
            animations: 'disabled',
        });

        const className = await link.getAttribute('class');
        expect(className).toContain('hover:text-link-hover');
        expect(className).toContain('visited:text-link-visited');
        expect(styles.hoverToken).not.toBe(styles.linkToken);
        expect(styles.visitedToken).not.toBe(styles.linkToken);

        expect(consoleErrors).toEqual([]);
    });
}

test('dashboard reconciliation link uses TextLink styling', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsBrowserTestUser(page);
    await applyTheme(page, 'light');

    await page.goto('/dashboard');
    const link = page.getByTestId('reconciliation-details-link');
    await expect(link).toBeVisible({ timeout: 15000 });

    const styles = await measureContentLink(
        page,
        '[data-testid="reconciliation-details-link"]',
    );
    expect(styles.colorsDifferFromBody).toBe(true);
    expect(styles.hasUnderline).toBe(true);

    await page.screenshot({
        path: path.join(verificationDir, 'dashboard-reconciliation-link.png'),
        animations: 'disabled',
    });

    expect(consoleErrors).toEqual([]);
});
