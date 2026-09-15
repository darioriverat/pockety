# Test #83 — Period format YYYYMM validation

## Status
Verified end-to-end with Playwright screenshots.

## Screenshots
- `01-invalid-period-2025-01.png` — client error for `2025-01`
- `02-invalid-period-01-2025.png` — client error for `01/2025`
- `03-valid-period-accepted.png` — accepts `202601` and creates transaction

## Notes
Playwright run: `/dev/browser-tests?grep=feature%2083`
