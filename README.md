# Pockety

**Personal Finance Manager** — a Laravel + React (TypeScript, Inertia) application for tracking
multi-currency income, expenses, budgets, account balances, and net worth across Canada and Colombia.

## Overview

Pockety is an authenticated, owner-scoped finance app. Every financial row is scoped to the current
user, so one user can never read or change another user's data. Supported currencies are **CAD, USD,
and COP** only, and the default locale is **English**.

Core capabilities:

- **Accounts** — banks, investments, liabilities, and receivables with per-account recorded balances.
- **Transactions** — multi-currency ledger with filters, categories, bulk edit, and duplicate.
- **Categories** — user-owned names used by budgets, reports, and transaction classification.
- **Reconciliation** — read-only check of recorded vs computed balances for a period.
- **Period balances** — month-end figures registered after reconciliation.
- **Balance sheet / income statement** — assets = liabilities + equity, with history.
- **Exchange rates** — USD-base daily snapshots (CAD per USD, COP per USD) assigned per period.
- **Import** — user-uploaded JSON/CSV files (transactions, accounts month sheets, balance sheet).
- **English / Spanish** — per-user locale with translated UI and validation messages.

## Current Work: Change Specification

The authoritative source of truth for the current work is [`app_spec.txt`](app_spec.txt). It defines
eight change areas:

1. Remove GitHub links from the UI.
2. Import by user upload (no hardcoded paths).
3. Manage Balances dialog scroll constraint.
4. Edit an account with a type lock when transactions exist.
5. Filter the transaction list by account.
6. English and Spanish (per-user locale + react-i18next).
7. Docsify documentation under `docs/`.
8. Daily exchange-rate snapshots and per-period selection.

Behavior not described in the spec must stay as it is. Do not invent features, currencies, languages,
or import formats beyond what the spec states.

## Implementation Roadmap

[`feature_list.json`](feature_list.json) is the single source of truth for what must be built. It
contains end-to-end test cases covering every acceptance item in the spec, ordered by the spec's
implementation order.

**CRITICAL RULE:** features may **only** be marked as passing (`"passes": false` → `"passes": true`).
Never remove a feature, edit its description, or modify its testing steps. This guarantees no
functionality is silently dropped.

Check progress:

```bash
# Completed features
grep -c '"passes": true' feature_list.json

# Remaining features
grep -c '"passes": false' feature_list.json
```

## Quick Start

### Prerequisites

- Docker with the [pleets/devbox-station](https://github.com/pleets/devbox-station) stack running
  (this repo usually lives at `~/www-apps/devbox-station` with custom config in
  `~/www-apps/devbox-station/user`).
- `127.0.0.1  dev.pockety.com` in `/etc/hosts`.

### Setup

```bash
./init.sh
```

`init.sh` checks Docker and the `web_app` container, installs Composer and NPM dependencies, creates
`.env` and the app key when missing, runs migrations, builds the frontend, and reports the optional
`OPENEXCHANGERATES_APP_ID` integration status.

## Development

| | |
|---|---|
| **Local URL** | http://dev.pockety.com:8080/ |
| **Container** | `web_app` |
| **Source mount** | `/var/www/vhosts` |

Common commands (via [`Taskfile.yml`](Taskfile.yml)):

```shell
task shell               # shell in the container
task shell-root          # root shell in the container
task tests               # backend + frontend unit tests
task backend-tests       # php artisan test
task frontend-tests      # vitest run
task browser-test-seed   # seed Playwright data
task browser-test-install# install Playwright chromium
task browser-tests       # Playwright browser suite
task dev                 # Vite dev server with hot reload
task build               # build production assets
```

You can also run things directly:

```bash
docker exec -u appuser -w /var/www/vhosts web_app bash -lc "php artisan test --filter=AccountApiTest"
docker exec -u appuser -w /var/www/vhosts web_app bash -lc "npm run test:unit"
```

## Project Structure

```
app/                     Laravel application code (controllers, services, models)
config/                  Laravel configuration
database/                Migrations, seeders, factories
resources/js/            React + TypeScript frontend (pages, components, locales, hooks)
resources/js/locales/    i18next catalogs (en, es)
routes/                  api.php, web.php, console.php
tests/Feature/           PHPUnit feature tests
tests/browser/           Playwright browser tests
tests/fixtures/          Small synthetic import fixtures
docs/                    Docsify documentation (docsify 4 via CDN)
plan/extracted/          Legacy personal data — out of scope, not read by app code or tests
feature_list.json        End-to-end test cases (implementation roadmap)
app_spec.txt             Change specification (source of truth)
init.sh                  Development environment setup
Taskfile.yml             Task runner configuration
```

## Testing

- **Backend:** `php artisan test`
- **Frontend unit/component:** `npm run test:unit`
- **Browser:** `npm run test:browser` (Playwright, base URL `http://dev.pockety.com:8080`)

Project conventions:

- Tests must not read `plan/extracted` and must not POST a `directory` or personal `file_path`.
- Import tests use the synthetic fixtures under `tests/fixtures/` or factories.
- Exchange-rate tests fake the HTTP client; never call the live Open Exchange Rates API.

## Exchange Rates

Exchange rates use a USD base:

- `cad_per_usd` — CAD units per 1 USD (e.g. `1.36` means `1 USD = 1.36 CAD`).
- `cop_per_usd` — COP units per 1 USD.

Daily global snapshots are fetched with:

```bash
php artisan exchange-rates:fetch
```

The command reads `OPENEXCHANGERATES_APP_ID` / `config('services.openexchangerates.app_id')` and is
scheduled daily in `routes/console.php`. Production requires the Laravel scheduler
(`php artisan schedule:run` via cron); locally run the command directly until cron is running. With
no app id, the command logs a warning and exits successfully without writing a row.

## Documentation

The end-user guides live in `docs/` and are served with Docsify:

```bash
npx --yes docsify-cli serve docs
```

Docsify is loaded from a CDN and is **not** an application dependency. The guides are written in
English and stay in English.

## Contributing

This is an autonomous development project. Each session:

1. Picks the next unfinished feature from `feature_list.json`.
2. Works on one feature at a time.
3. Tests it thoroughly before flipping `"passes"` to `true`.
4. Commits with a descriptive message.
5. Leaves the environment in a clean, working state.

## License

Private project — all rights reserved.
