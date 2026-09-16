import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-163-page-titles',
);

const pages = [
    {
        path: '/dashboard',
        title: 'Dashboard',
        testId: 'page-title',
        screenshot: '01-dashboard-title.png',
    },
    {
        path: '/transactions',
        title: 'Transactions',
        testId: 'transactions-heading',
        screenshot: '02-transactions-title.png',
    },
    {
        path: '/accounts',
        title: 'Accounts',
        testId: 'page-title',
        screenshot: '03-accounts-title.png',
    },
] as const;

test.beforeAll(() => {
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 163: page titles are prominent and descriptive', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsBrowserTestUser(page);

    const titleStyles: Array<{
        path: string;
        fontSize: string;
        fontWeight: string;
    }> = [];

    for (const entry of pages) {
        await page.goto(entry.path);
        const heading = page.getByTestId(entry.testId);
        await expect(heading).toBeVisible();
        await expect(heading).toHaveText(entry.title);
        await expect(heading).toHaveJSProperty('tagName', 'H1');

        const header = page.getByTestId('page-header');
        await expect(header).toBeVisible();
        await expect(page.getByTestId('page-title-description')).toBeVisible();

        const styles = await heading.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
            };
        });

        // text-3xl ≈ 30px; bold ≈ 700
        expect(Number.parseFloat(styles.fontSize)).toBeGreaterThanOrEqual(28);
        expect(Number.parseInt(styles.fontWeight, 10)).toBeGreaterThanOrEqual(
            700,
        );

        titleStyles.push({ path: entry.path, ...styles });

        await page.screenshot({
            animations: 'disabled',
            path: path.join(verificationDir, entry.screenshot),
            fullPage: false,
        });
    };

    // Step 5: title styling consistent across pages
    const baseline = titleStyles[0];
    for (const style of titleStyles.slice(1)) {
        expect(style.fontSize).toBe(baseline.fontSize);
        expect(style.fontWeight).toBe(baseline.fontWeight);
    }

    expect(errors).toEqual([]);
});
