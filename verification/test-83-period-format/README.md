# Test #83 — Period format YYYYMM validation

## Status
Implementation complete. **UI screenshots blocked** in this session (sandbox denies Chrome launch and Docker socket; `required_permissions: ["all"]` cannot be approved in Local SDK).

## API verification (this session)

Invalid period `2025-01`:
```json
{"message":"The period must be in YYYYMM format.","errors":{"period":["The period must be in YYYYMM format."]}}
```

Invalid period `01/2025`: same period validation errors (size + format).

Invalid quincena `Q3` (related #84):
```json
{"message":"The quincena must be Q1 or Q2.","errors":{"quincena":["The quincena must be Q1 or Q2."]}}
```

## Code changes
- Frontend: client-side `isPeriodFormatValid` + inline `role="alert"` error on Add Transaction form
- Backend: clearer validation messages on store/update
- Tests: `TransactionValidationTest`, Vitest for `isPeriodFormatValid`, Playwright feature 83
- Capture script: `verification/capture-period-format.mjs`

## Next session (required before marking passes: true)
```bash
node verification/capture-period-format.mjs
# or in container:
docker exec -u appuser -w /var/www/vhosts -e PLAYWRIGHT_BASE_URL=http://host.docker.internal:8080 web_app bash -lc "node verification/capture-period-format.mjs"
task backend-tests
task frontend-tests
```
Then update `feature_list.json` test #83 `"passes": true` after screenshots exist under `verification/test-83-period-format/`.
