# Test #107 — Variance Acknowledgment

## Feature
User can manually mark an account variance as reviewed/acknowledged with an optional note.
Variance amounts remain visible; a "Reviewed" indicator and review note are shown.

## Implementation
- Migration: `variance_acknowledgments` (account_id + period unique)
- Model: `VarianceAcknowledgment`
- API: `POST /api/periods/{period}/reconciliation/{accountId}/acknowledge`
- Reconciliation report includes `is_reviewed`, `review_note`, `reviewed_at`
- UI: Acknowledge dialog on reconciliation page + Reviewed badge

## Verification (Session 57)
- Frontend unit tests: 18/18 passing (warnings + acknowledgment)
- API acknowledge for account 1 / period 202501 → 200, `is_reviewed=true`
- Subsequent GET reconciliation returns reviewed state with note while variance CAD=$1000 remains
- Authenticated Inertia page loads: `reports-ytd` (2025/2026), `reconciliation`, `dashboard`
- Puppeteer MCP and Docker exec unavailable in this environment (interactive approval blocked)
- Playwright cannot launch browsers inside the sandbox (SIGABRT/EPERM)

## Next session
1. Run `php artisan migrate` in container (idempotent if table already exists)
2. Browser-verify UI screenshots for tests #105–#107, then mark `passes: true`
3. Run `task backend-tests` / `task frontend-tests`
