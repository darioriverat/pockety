#!/usr/bin/env node
/**
 * Browser-verify docsify guides (features 74-84).
 * Uses system Chrome via Playwright channel.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const base = process.env.DOCS_BASE_URL || 'http://127.0.0.1:3000';
const outDir = path.join(process.cwd(), 'verification', 'docsify');
mkdirSync(outDir, { recursive: true });

const pages = [
  { hash: '#/', name: 'readme', title: 'Pockety' },
  { hash: '#/accounts', name: 'accounts', title: 'Accounts' },
  { hash: '#/categories', name: 'categories', title: 'Categories' },
  { hash: '#/transactions', name: 'transactions', title: 'Transactions' },
  { hash: '#/reconciliation', name: 'reconciliation', title: 'Reconciliation' },
  { hash: '#/period-balances', name: 'period-balances', title: 'Period Balances' },
];

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true,
});

const results = [];

async function capture(page, viewport, suffix) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(400);
  for (const entry of pages) {
    await page.goto(`${base}/${entry.hash}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.markdown-section h1', { timeout: 15000 });
    const h1 = (await page.locator('.markdown-section h1').first().innerText()).trim();
    const sidebarText = await page.locator('.sidebar-nav').innerText();
    const bodyText = await page.locator('.markdown-section').innerText();
    const leakedMd = /(?:^|\n)\s*#{1,6}\s+\w+|^\*\s+\[/m.test(
      await page.locator('.markdown-section').evaluate((el) => el.innerHTML.includes('##') ? '' : el.innerText),
    );
    const rawLeak = bodyText.includes('## ') || bodyText.includes('* [Home]');
    await page.screenshot({
      path: path.join(outDir, `${entry.name}-${suffix}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({
      page: entry.name,
      viewport: suffix,
      h1,
      expectedTitle: entry.title,
      titleOk: h1.includes(entry.title) || (entry.name === 'readme' && h1.includes('Pockety')),
      sidebarHasAccounts: /Accounts/i.test(sidebarText),
      sidebarHasCategories: /Categories/i.test(sidebarText),
      sidebarHasTransactions: /Transactions/i.test(sidebarText),
      sidebarHasReconciliation: /Reconciliation/i.test(sidebarText),
      sidebarHasPeriodBalances: /Period Balances/i.test(sidebarText),
      notStub: bodyText.length > 80,
      noRawLeak: !rawLeak,
      bodyPreview: bodyText.slice(0, 120).replace(/\s+/g, ' '),
    });
  }
}

const page = await browser.newPage();
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.$docsify && window.$docsify.name === 'Pockety');
const config = await page.evaluate(() => ({
  name: window.$docsify.name,
  loadSidebar: window.$docsify.loadSidebar,
  subMaxLevel: window.$docsify.subMaxLevel,
}));
results.push({ config });

await capture(page, { width: 1440, height: 900 }, 'desktop');
await capture(page, { width: 390, height: 844 }, 'mobile');

// Sidebar toggle presence on mobile (docsify button)
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/#/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const toggleVisible = await page.locator('.sidebar-toggle').isVisible().catch(() => false);
results.push({ mobileSidebarToggleVisible: toggleVisible });

await browser.close();

const summaryPath = path.join(outDir, 'summary.json');
writeFileSync(summaryPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

const failed = results.filter(
  (r) => r.titleOk === false || r.notStub === false || r.noRawLeak === false,
);
if (config.name !== 'Pockety' || config.loadSidebar !== true || config.subMaxLevel !== 2) {
  console.error('CONFIG_FAIL', config);
  process.exit(1);
}
if (failed.length) {
  console.error('PAGE_FAIL', failed);
  process.exit(1);
}
console.log('DOCSIFY_OK', outDir);
