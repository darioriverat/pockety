# Session 21 Verification Notes

Date: 2026-09-14 / 2026-09-15

## Environment

- App reachable at http://dev.pockety.com:8080/ (HTTP 200)
- Docker socket not accessible from agent sandbox (`docker exec` blocked)
- Puppeteer MCP blocked (local SDK cannot request interactive approval)
- Worked around via `/dev/*` local routes: `build-assets`, `run-tests`, `frontend-tests`, `login-as-test-user`

## Income feature (tests #42-45) — VERIFIED

API end-to-end (curl):
- POST CAD income `Salary - Main Job` → 201, amount 5000
- POST mixed CAD 1000 + USD 500 → total_cad_equivalent 1375 (1000 + 500*0.75)
- 6 lines accepted; 7th rejected with 422
- COP 2,000,000 → CAD 666.67 ( / 3000 )
- Empty amounts rejected with 422
- Period list meta.total_cad_equivalent aggregates correctly (6375)

UI:
- Authenticated `/income` returns Inertia component `income`
- Sidebar includes Income nav item
- Assets built; `public/build/assets/income-*.js` present

Automated tests:
- `IncomeTest` — 9/9 OK
- `income.test.tsx` — all passing (with dashboard test fixes)
- `tests/browser/income.spec.ts` added for Playwright

## Prior features verified this session

- Reconciliation (#36-39): `ReconciliationTest` 3/3 OK; `/reconciliation` page loads when authenticated
- Dashboard summary cards (#48-50): `DashboardTest` 7/7 OK; float assertion mismatch fixed; frontend unit tests fixed for duplicate labels

## Counts

- Passing: 46 / 175
- Remaining: 129
