#!/bin/bash
# Script to run the 6 E2E browser tests and update feature_list.json if all pass
#
# Usage:
#   From outside Docker (local machine):
#     ./run-e2e-tests.sh
#
#   From inside Docker:
#     task browser-tests

set -e  # Exit on error

echo "======================================================================"
echo "Running 6 E2E Browser Tests"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running inside Docker or locally
if [ -f /.dockerenv ]; then
    echo "Detected Docker environment"
    BASE_URL="http://dev.pockety.com:8080"
else
    echo "Detected local environment"
    BASE_URL="http://dev.pockety.com:8080"
fi

echo "Base URL: $BASE_URL"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check if app is running
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo -e "${RED}Error: Application not accessible at $BASE_URL${NC}"
    echo "Please start the application first"
    exit 1
fi
echo -e "${GREEN}✓${NC} Application is running"

# Check Playwright installation
if ! npm list @playwright/test > /dev/null 2>&1; then
    echo -e "${RED}Error: Playwright not installed${NC}"
    echo "Run: npm install"
    exit 1
fi
echo -e "${GREEN}✓${NC} Playwright is installed"

# Install browser binaries if needed
echo ""
echo "Installing Playwright browser binaries (if needed)..."
npx playwright install chromium --with-deps > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Browser binaries ready"

# Seed the database
echo ""
echo "Seeding browser test data..."
if command -v php &> /dev/null; then
    php artisan migrate:fresh --seed --seeder=BrowserTestSeeder --force
else
    # Fall back to HTTP endpoints
    curl -sf "$BASE_URL/dev/migrate-fresh" > /dev/null
    curl -sf "$BASE_URL/dev/seed-browser" > /dev/null
fi
echo -e "${GREEN}✓${NC} Database seeded"

# Run the E2E tests
echo ""
echo "======================================================================"
echo "Running E2E Tests"
echo "======================================================================"
echo ""

PLAYWRIGHT_BASE_URL="$BASE_URL" npx playwright test \
    tests/browser/e2e-category-workflow.spec.ts \
    tests/browser/e2e-two-user-isolation.spec.ts \
    tests/browser/e2e-category-create-workflow.spec.ts \
    tests/browser/e2e-category-edit-workflow.spec.ts \
    tests/browser/e2e-category-inactivate-picker.spec.ts \
    tests/browser/e2e-delete-rejection.spec.ts \
    --reporter=list

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo -e "${GREEN}✓ All E2E Tests Passed!${NC}"
    echo "======================================================================"
    echo ""
    echo "Next steps:"
    echo "1. Review screenshots in verification/ directories"
    echo "2. Update feature_list.json manually:"
    echo "   - Change 'passes': false to 'passes': true for features 101-106"
    echo "3. Commit the updated feature_list.json"
    echo ""
else
    echo ""
    echo "======================================================================"
    echo -e "${RED}✗ Some E2E Tests Failed${NC}"
    echo "======================================================================"
    echo ""
    echo "Review the test output above for details."
    echo "Check screenshots in test-results/ for visual verification."
    echo ""
    exit 1
fi
