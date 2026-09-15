# Test #84 — Quincena Q1/Q2 only

## Status
Verified end-to-end with Playwright screenshots.

## Screenshots
- `01-quincena-options.png` — dropdown shows only Q1 and Q2
- `02-quincena-q1-accepted.png` — Q1 selection creates transaction

## Notes
Playwright run: `/dev/browser-tests?grep=feature%2084`
Backend also rejects `Q3` with 422 (`TransactionValidationTest`).
