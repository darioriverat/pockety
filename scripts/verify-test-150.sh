#!/bin/bash

# Verification script for Test 150: Error messages with icons
# This script should be run from the project root

echo "=== Test 150 Verification: Error Messages with Icons ==="
echo ""

# Step 1: Build frontend assets
echo "Step 1: Building frontend assets..."
docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && npm run build"

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✓ Build completed"
echo ""

# Step 2: Run frontend unit tests
echo "Step 2: Running frontend unit tests..."
docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && npm run test:unit"

if [ $? -ne 0 ]; then
    echo "❌ Frontend tests failed"
    exit 1
fi

echo "✓ Frontend tests passed"
echo ""

# Step 3: Run browser test
echo "Step 3: Running browser test..."
docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && npx playwright install chromium"
docker exec -u appuser web_app bash -lc "cd /var/www/vhosts && PLAYWRIGHT_BASE_URL=http://host.docker.internal:8080 npx playwright test tests/browser/error-messages.spec.ts"

if [ $? -ne 0 ]; then
    echo "❌ Browser test failed"
    exit 1
fi

echo "✓ Browser test passed"
echo ""

echo "=== All verification steps completed successfully! ==="
echo ""
echo "Screenshots saved to: verification/test-150-error-messages/"
echo ""
echo "Changes implemented:"
echo "  ✓ Added AlertCircle icon to all error messages"
echo "  ✓ Error messages styled with red color (text-destructive)"
echo "  ✓ Icons positioned inline with error text"
echo "  ✓ Error messages positioned near relevant fields"
echo ""
echo "Files modified:"
echo "  - resources/js/pages/transactions.tsx"
echo "  - resources/js/pages/accounts.tsx"
echo "  - resources/js/pages/income.tsx"
echo "  - resources/js/pages/reconciliation.tsx"
echo ""
echo "Files added:"
echo "  - resources/js/pages/transactions-error-messages.test.tsx"
echo "  - tests/browser/error-messages.spec.ts"
