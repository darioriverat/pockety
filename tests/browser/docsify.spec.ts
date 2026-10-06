import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Docsify guides live under docs/ and are not linked from the app UI.
 * Prefer DOCS_BASE_URL, else the local Laravel /dev/docsify mount, else port 3456.
 */
const docsBase =
    process.env.DOCS_BASE_URL ||
    `${process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080'}/dev/docsify`;

const pages = [
    { hash: '#/', title: /Pockety/i },
    { hash: '#/accounts', title: /Accounts/i },
    { hash: '#/categories', title: /Categories/i },
    { hash: '#/transactions', title: /Transactions/i },
    { hash: '#/reconciliation', title: /Reconciliation/i },
    { hash: '#/period-balances', title: /Period Balances/i },
];

test.describe('docsify guides', () => {
    test.beforeAll(() => {
        mkdirSync(path.join(process.cwd(), 'verification', 'docsify'), {
            recursive: true,
        });
    });

    test('loads docsify 4 config and sidebar pages at desktop and mobile', async ({
        browser,
    }) => {
        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
        });
        const page = await context.newPage();

        await page.goto(`${docsBase}/`, { waitUntil: 'networkidle' });
        await page.waitForFunction(
            () =>
                Boolean(
                    (window as Window & { $docsify?: { name?: string } }).$docsify
                        ?.name,
                ),
        );

        // Docsify mutates loadSidebar from true to "_sidebar.md" after boot.
        const config = await page.evaluate(() => {
            const d = (window as Window & { $docsify: Record<string, unknown> })
                .$docsify;
            return {
                name: d.name,
                loadSidebar: d.loadSidebar,
                subMaxLevel: d.subMaxLevel,
            };
        });
        const bootSource = await page.locator('script').evaluateAll((nodes) =>
            nodes.map((n) => n.textContent || '').join('\n'),
        );
        expect(config.name).toBe('Pockety');
        expect(bootSource).toMatch(/loadSidebar:\s*true/);
        expect(config.loadSidebar === true || config.loadSidebar === '_sidebar.md').toBe(
            true,
        );
        expect(config.subMaxLevel).toBe(2);

        await page.waitForSelector('.sidebar-nav', { timeout: 15000 });
        const sidebar = page.locator('.sidebar-nav');
        await expect(sidebar).toContainText('Accounts');
        await expect(sidebar).toContainText('Categories');
        await expect(sidebar).toContainText('Transactions');
        await expect(sidebar).toContainText('Reconciliation');
        await expect(sidebar).toContainText('Period Balances');

        for (const entry of pages) {
            await page.goto(`${docsBase}/${entry.hash}`, {
                waitUntil: 'networkidle',
            });
            await page.waitForSelector('.markdown-section h1', {
                timeout: 15000,
            });
            await expect(page.locator('.markdown-section h1').first()).toHaveText(
                entry.title,
            );
            const body = await page.locator('.markdown-section').innerText();
            expect(body.length).toBeGreaterThan(80);
            expect(body.includes('* [Home]')).toBeFalsy();

            const name = entry.hash.replace('#/', '') || 'readme';
            await page.screenshot({
                path: path.join(
                    'verification',
                    'docsify',
                    `${name}-desktop.png`,
                ),
                fullPage: true,
                animations: 'disabled',
            });
        }

        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${docsBase}/#/`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.markdown-section h1');
        await page.screenshot({
            path: path.join('verification', 'docsify', 'readme-mobile.png'),
            fullPage: true,
            animations: 'disabled',
        });
        await expect(page.locator('.sidebar-toggle')).toBeVisible();

        for (const entry of pages.slice(1)) {
            await page.goto(`${docsBase}/${entry.hash}`, {
                waitUntil: 'networkidle',
            });
            await page.waitForSelector('.markdown-section h1');
            const name = entry.hash.replace('#/', '');
            await page.screenshot({
                path: path.join(
                    'verification',
                    'docsify',
                    `${name}-mobile.png`,
                ),
                fullPage: true,
                animations: 'disabled',
            });
        }

        await context.close();
    });
});
