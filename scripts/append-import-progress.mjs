import { appendFileSync, readFileSync } from 'node:fs';

const features = JSON.parse(readFileSync('feature_list.json', 'utf8'));
const passing = features.filter((feature) => feature.passes).length;
const total = features.length;

const note = `
## Session: 2026-10-06 (Import by user upload)

### Accomplished
1. **Section 2 — Import by user upload (features 27-39) DONE**
   - Controllers accept multipart uploads only; reject \`file_path\`/\`directory\`.
   - Temp-store under \`tmp/imports\`, parse, delete in \`finally\`.
   - Invalid JSON/shape/extension and structural month-sheet/CSV errors return 422.
   - \`TransactionImportService::importFromCsv\` maps flat cad/usd/cop columns.
   - \`AccountImportService::importFromFiles\` for uploaded month sheets.
   - Import UI: empty file inputs for transactions (.json/.csv), accounts (multi .json),
     balance sheet (.json); client-side empty-submit guard; no personal filenames.
   - Synthetic fixtures under \`tests/fixtures/\` (no \`plan/extracted\` copies).
   - Updated PHPUnit + Playwright + frontend unit coverage; accounts/balance-sheet
     browser specs upload fixtures instead of directory/path POSTs.

2. **Verification**
   - Backend: \`php artisan test\` 396 passed.
   - Frontend: import unit tests + full suite via session helpers.
   - Browser: \`import-upload.spec.ts\` 5/5; \`accounts.spec.ts\` 3/3;
     \`balance-sheet.spec.ts\` 3/3 (including uploaded balance-sheet fixture).
   - Screenshots in \`verification/import-upload/\`.
   - Puppeteer MCP blocked in this session; Playwright UI verification used instead.
   - Recreated corrupted sqlite after concurrent migrate-fresh collisions.

### Progress
- **${passing}/${total} features passing** (was 23/${total}).
- Flipped import functional + style features 27-39 to true.

### Next priority
Locale preference and translations (spec section 6 / features ~40+):
- users.locale migration (en/es), preferences language select, react-i18next catalogs,
  Laravel locale middleware for authenticated requests.
Then exchange-rate snapshots (section 8) and docsify guides (section 7).
`;

appendFileSync('claude-progress.txt', note);
console.log(`appended progress; ${passing}/${total}`);
