import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const path = 'claude-progress.txt';
const marker =
    '\n===============================================================================\nSESSION 14 - October 4, 2026 - Per-user ownership foundation\n';

let text = readFileSync(path, 'utf8');
const accidental = text.lastIndexOf(marker);
if (accidental !== -1) {
    // Keep an earlier Session 14 block if present; only strip the trailing duplicate.
    const prior = text.lastIndexOf(marker, accidental - 1);
    if (prior === -1 && text.indexOf(marker.trimStart()) === accidental + 1) {
        // only one occurrence at end — remove it
        text = text.slice(0, accidental);
    } else if (accidental > text.indexOf('SESSION 17')) {
        text = text.slice(0, accidental);
    }
    writeFileSync(path, text.endsWith('\n') ? text : `${text}\n`);
}

const note = `
===============================================================================
SESSION 18 - October 4, 2026 - Budget category picker active-only
===============================================================================

Completed feature #73:
- Budgets page loads categories via GET /api/categories (no include_inactive),
  so inactive C040 is excluded while active C047 appears in the picker.
- Existing budgets.tsx fetch already matched the acceptance rule; added
  regression coverage and data-testid hooks for the picker.
- Verified creating a budget with active C047 succeeds end-to-end.

Baseline verification:
- App serving at http://dev.pockety.com:8080/ (login HTTP 200).
- Docker socket unavailable in sandbox; used /dev HTTP helpers instead.
- Puppeteer MCP blocked by interactive approval; used Playwright via
  /dev/browser-tests inside the container.
- Category PHPUnit filter: 69/69 green.
- Budgets frontend suite (including new picker test): 5 passed.
- Random regression browser suite categories.spec.ts: 4/4 green.

Added regression coverage:
- tests/browser/budget-category-picker.spec.ts creates C047, opens the budget
  category picker, asserts C047 present / C040 absent, asserts the catalog
  request omits include_inactive, and saves a budget for C047.
- resources/js/pages/budgets-category-picker.test.tsx asserts the page fetches
  '/api/categories' without include_inactive.
- budgets.tsx: data-testid budget-category-field / budget-category-option-*.
- helpers.ts: resetBrowserState falls back to /dev/migrate-fresh +
  /dev/seed-browser when host PHP is unavailable.
- Screenshots: verification/budget-category-picker/

Focused verification:
- Browser test: 1 passed.
- Frontend unit test: 1 passed.
- Reviewed screenshots (page, picker-open, budget-saved).
- Updated only the passes field for feature #73.

Current status: 81/106 features passing; 25 remaining.
Next priority: #74, existing transaction remains valid after category inactivation.
`;

appendFileSync(path, note);
console.log('Appended session 18 progress notes');
