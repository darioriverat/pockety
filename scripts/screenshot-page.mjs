#!/usr/bin/env node
/**
 * Lightweight Chrome screenshot helper when MCP puppeteer is unavailable.
 * Uses Playwright with system Chrome channel.
 *
 * Usage: PLAYWRIGHT_CHANNEL=chrome node scripts/screenshot-page.mjs /accounts accounts-typography
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const base = process.env.APP_BASE_URL || 'http://dev.pockety.com:8080';
const pagePath = process.argv[2] || '/accounts';
const name = process.argv[3] || 'screenshot';
const outDir = path.join(process.cwd(), 'verification', 'test-165-typography');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${base}/dev/login-as-test-user?redirect=${encodeURIComponent(pagePath)}`);
await page.waitForURL(new RegExp(pagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
await page.waitForTimeout(500);

const out = path.join(outDir, `${name}.png`);
await page.screenshot({ path: out, animations: 'disabled' });
console.log('saved', out);

// Capture typography metrics when on accounts
if (pagePath.includes('accounts')) {
    const metrics = await page.evaluate(() => {
        const measure = (el) => {
            if (!el) return null;
            const c = getComputedStyle(el);
            return {
                tag: el.tagName,
                fontSize: c.fontSize,
                fontWeight: c.fontWeight,
                lineHeight: c.lineHeight,
                text: (el.textContent || '').trim().slice(0, 40),
            };
        };
        return {
            h1: measure(document.querySelector('[data-testid="page-title"]')),
            h2: measure(
                document.querySelector('[data-testid="accounts-assets-heading"]'),
            ),
            h3: measure(
                document.querySelector('[data-testid="account-card-title"]'),
            ),
            body: measure(document.body),
        };
    });
    console.log(JSON.stringify(metrics, null, 2));
}

await browser.close();
