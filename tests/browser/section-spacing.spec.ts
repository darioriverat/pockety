import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-164-section-spacing',
);

const pages = [
    { path: '/dashboard', screenshot: '01-dashboard-spacing.png' },
    { path: '/transactions', screenshot: '02-transactions-spacing.png' },
    { path: '/accounts', screenshot: '03-accounts-spacing.png' },
    { path: '/balance-sheet', screenshot: '04-balance-sheet-spacing.png' },
] as const;

test.beforeAll(() => {
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 164: spacing between sections is consistent', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsBrowserTestUser(page);

    const measured: Array<{
        path: string;
        paddingTop: number;
        paddingLeft: number;
        gap: number;
    }> = [];

    for (const entry of pages) {
        await page.goto(entry.path);
        const container = page.locator('[data-page-container]').first();
        await expect(container).toBeVisible();

        const styles = await container.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                paddingTop: Number.parseFloat(computed.paddingTop),
                paddingLeft: Number.parseFloat(computed.paddingLeft),
                gap: Number.parseFloat(computed.rowGap || computed.gap || '0'),
            };
        });

        // Canonical scale: p-4/sm:p-6 (16px / 24px) and gap-6 (24px)
        expect(styles.paddingTop).toBeGreaterThanOrEqual(16);
        expect(styles.paddingLeft).toBeGreaterThanOrEqual(16);
        expect(styles.gap).toBe(24);

        measured.push({ path: entry.path, ...styles });

        await page.screenshot({
            animations: 'disabled',
            path: path.join(verificationDir, entry.screenshot),
            fullPage: false,
        });
    }

    const baseline = measured[0];
    for (const entry of measured.slice(1)) {
        expect(entry.paddingTop).toBe(baseline.paddingTop);
        expect(entry.paddingLeft).toBe(baseline.paddingLeft);
        expect(entry.gap).toBe(baseline.gap);
    }

    expect(errors).toEqual([]);
});
