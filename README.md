# Pockety

**Personal Finance Manager** - A Laravel + React application for tracking multi-currency income, expenses, budgets, and account balances across Canada and Colombia.

## Overview

Pockety replaces a Google Sheets-based personal finance system with a programmatic solution that:
- Tracks income, expenses, and budgets across **three currencies** (CAD, USD, COP)
- Manages **bank accounts, investments, credit cards, and loans**
- Performs monthly **reconciliation** (recorded vs computed balances)
- Generates **balance sheets** (Assets = Liabilities + Equity)
- Supports **45 expense categories** with Spanish/English names
- Distinguishes **debt principal vs interest** to prevent double-counting expenses
- Handles **multi-country finances** (Canada and Colombia)

## Quick Start

### First-Time Setup

Run the initialization script:

```bash
./init.sh
```

This will:
1. Check Docker is running
2. Install Composer dependencies
3. Install NPM dependencies
4. Set up `.env` file
5. Generate Laravel application key
6. Run database migrations
7. Build frontend assets

### Prerequisites

- Docker and Docker Compose running
- Add to `/etc/hosts`: `127.0.0.1  dev.pockety.com`

## Development

| |                                             |
|---|---------------------------------------------|
| **Local URL** | http://dev.pockety.com:8080/ (default port) |
| **Container** | `web_app`                                   |
| **Source mount** | `/var/www/vhosts`                           |

### Common Commands

```shell
# Shell in the container
task shell

# Run all tests
task tests

# Run backend tests
task backend-tests

# Run frontend unit/component tests
task frontend-tests

# Seed browser test data
task browser-test-seed

# Install Playwright browser binaries
task browser-test-install

# Run browser tests
task browser-tests

# Start development server (with hot reload)
task dev
```

## Project Structure

```
├── app/                  # Laravel application code
├── database/             # Migrations, seeders, factories
├── resources/            # React frontend, views, assets
├── routes/               # API and web routes
├── tests/                # PHPUnit tests
├── plan/                 # Project planning documents
│   └── extracted/        # Historical data (JSON/CSV)
├── feature_list.json     # 200+ test cases (implementation roadmap)
├── app_spec.txt          # Complete project specification
├── init.sh               # Development environment setup script
└── Taskfile.yml          # Task runner configuration
```

## Technology Stack

- **Backend**: Laravel (PHP)
- **Frontend**: React + TypeScript + Vite
- **Database**: MySQL/PostgreSQL (configured via .env)
- **Development**: Docker
- **Build Tools**: Composer, NPM, Vite

## Key Features

### Multi-Currency Support
- CAD (Canadian Dollar)
- USD (US Dollar)
- COP (Colombian Peso)
- Independent exchange rate series per period

### Account Reconciliation
- Track **recorded balances** (from real bank statements)
- Calculate **computed balances** (from transaction ledger)
- Monitor **variance** (should be zero when reconciled)
- Works across all account types: banks, investments, credit cards, loans

### Expense Categories
45 active categories covering:
- Groceries, dining, transportation, utilities
- Education, healthcare, entertainment
- Debt payments (credit cards, loans)
- Colombian-specific: PILA (social security), etc.

### Business Rules
- **Total Recorded Disbursements**: Sum of all expenses including debt payments
- **Net Operating Expenses**: Total minus debt principal (excludes double-counting)
- **Debt Principal**: Not an expense (reduces liability)
- **Debt Interest**: IS an expense (included in Net Operating Expenses)

### Balance Sheet Reporting
- **Assets**: Bank accounts + investments + receivables + fixed assets
- **Liabilities**: Credit cards + loans
- **Equity**: Assets - Liabilities
- Time series tracking across multiple periods

## Feature Implementation

Implementation is guided by `feature_list.json` containing 200+ detailed test cases.

**CRITICAL RULE**: Features can ONLY be marked as passing (`"passes": true`). Never remove, edit descriptions, or modify testing steps. This ensures complete coverage.

Check implementation progress:
```bash
# Count completed features
grep '"passes": true' feature_list.json | wc -l

# Count remaining features  
grep '"passes": false' feature_list.json | wc -l
```

## Historical Data

Historical data from the original spreadsheet (2025-2026) is available in `plan/extracted/`:
- `gastos_ledger_2025_2026.json` - 2,631 transactions
- `conceptos.json` - Category definitions
- `estado_financiero_2025_2026.json` - Balance sheet time series
- `month_sheets/` - Per-month data including exchange rates

## Testing

```bash
# Run all tests
task tests

# Run backend tests
task backend-tests

# Run frontend unit/component tests
task frontend-tests

# Seed browser test data
task browser-test-seed

# Install Playwright browser binaries
task browser-test-install

# Run browser tests
task browser-tests

# Run specific test
docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && php artisan test --filter=TestName"
```

## Contributing

This is an autonomous development project. Each session:
1. Works on ONE feature at a time from `feature_list.json`
2. Tests thoroughly before marking `"passes": true`
3. Commits progress with descriptive messages
4. Leaves environment in clean, working state

## Documentation

- `app_spec.txt` - Complete project specification
- `plan/PLAN.md` - Migration plan from spreadsheet
- `plan/PLAN_CLARIFICATIONS.md` - Clarifications and decisions
- `feature_list.json` - Implementation roadmap

## License

Private project - all rights reserved.

---

**Built with Laravel + React** | **Multi-currency** | **Multi-country** | **Production-ready quality**
