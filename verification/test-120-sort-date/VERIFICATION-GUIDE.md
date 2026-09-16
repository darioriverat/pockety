# Transaction Sort Verification (tests #120–#122)

## Implemented
- API: `sort_by` (`date`|`amount`|`category`) + `sort_dir` (`asc`|`desc`)
- UI: Date / Amount / Category column headers on transactions list
- Default sort remains date descending

## Verified this session
- Live API against `http://dev.pockety.com:8080` (create + all sort orders)
- Frontend unit tests: `resources/js/pages/transactions-sort.test.tsx`
- Built assets include `sort-header-date|amount|category`

## Blocked this session
- Puppeteer MCP and Playwright Chrome launches (sandbox SIGABRT / EPERM)
- Docker daemon (for `task backend-tests` / `task browser-tests`)
- Host `php` binary (for PHPUnit)

## Finish verification (outside Cursor sandbox)
```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- tests/browser/transaction-sort.spec.ts
# or
node verification/verify-transaction-sort-ui.mjs
# and
php artisan test --filter=TransactionSortTest
```

Then set `passes: true` for the three sort features in `feature_list.json` only after screenshots exist under:
- `verification/test-120-sort-date/`
- `verification/test-121-sort-amount/`
- `verification/test-122-sort-category/`
