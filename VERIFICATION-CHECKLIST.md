# Verification Checklist for Next Session

## ⚠️ CRITICAL: TWO SESSIONS NEED VERIFICATION

Both Session 18 (Reconciliation) and Session 19 (Dashboard) were implemented but could not be verified due to environment constraints.

## Pre-Verification Setup

### 1. Confirm Environment Access
```bash
# Check Docker is running
docker ps | grep web_app

# If not running, start the stack according to devbox-station docs
# Then run init.sh if needed
./init.sh
```

### 2. Verify Application is Accessible
```bash
# Try to access the app
curl -I http://dev.pockety.com:8080/

# Should return 200 OK or redirect to login
```

### 3. Check Puppeteer MCP Tools
Try using puppeteer_navigate in Cursor to verify MCP is working.
If it fails, this is a blocker for browser verification.

## Backend Test Verification

### Run All Backend Tests
```bash
task backend-tests
```

**Expected Results:**
- Total: 48 tests
- Breakdown:
  - 39 tests from sessions 1-17
  - 3 tests from session 18 (ReconciliationTest.php)
  - 6 tests from session 19 (DashboardTest.php)

**If tests fail:**
1. Read the error message carefully
2. Check which test failed
3. Debug the specific issue (likely data setup or service logic)
4. Fix and re-run until all pass
5. Commit fixes before proceeding

## Frontend Test Verification

### Run All Frontend Tests
```bash
task frontend-tests
```

**Expected Results:**
- All existing tests pass
- New tests pass:
  - dashboard.test.tsx (12 tests)

**If tests fail:**
1. Check for import errors
2. Check for component prop mismatches
3. Fix TypeScript/React issues
4. Re-run until all pass
5. Commit fixes before proceeding

## Browser Verification - Session 18 (Reconciliation)

### Test #36: System computes expected balance
```
1. Navigate to /reconciliation
2. Select period 202601 (or create test data for current period)
3. Verify "Computed" column shows calculated balances
4. Take screenshot: reconciliation-computed-balance.png
```

### Test #37: System calculates variance
```
1. On reconciliation page
2. Verify "Variance" column = Recorded - Computed
3. Verify non-zero variances are highlighted in red
4. Verify zero variances are shown in green
5. Take screenshot: reconciliation-variance.png
```

### Test #38: Multi-currency variance display
```
1. On reconciliation page
2. Find an account with multi-currency balances
3. Verify CAD, USD, COP rows all show recorded/computed/variance
4. Take screenshot: reconciliation-multi-currency.png
```

### Test #39: Transactions reference accounts
```
1. Navigate to /transactions
2. Click "Add Transaction"
3. Verify "Account" field is present in the form
4. Select an account, fill other fields, submit
5. Verify transaction appears with account name
6. Take screenshot: transaction-with-account.png
```

## Browser Verification - Session 19 (Dashboard)

### Test #48: Dashboard summary cards (income, expenses, net)
```
1. Navigate to /dashboard
2. Verify 3 cards display: "Total Income", "Total Expenses", "Net"
3. Verify amounts are formatted as currency (e.g., $5,000.00)
4. Verify Net card shows green for positive, red for negative
5. Take screenshot: dashboard-income-expenses-net.png
```

### Test #49: Dashboard account balances (assets, liabilities)
```
1. On dashboard page
2. Verify "Total Assets" card displays
3. Verify "Total Liabilities" card displays  
4. Verify "Equity" card displays (Assets - Liabilities)
5. Verify amounts are in CAD equivalent
6. Take screenshot: dashboard-assets-liabilities.png
```

### Test #50: Dashboard reconciliation status
```
1. On dashboard page
2. Verify "Reconciliation Status" card/badge is visible
3. Verify it shows "Balanced" or "Unbalanced" status
4. Verify account counts are shown (e.g., "5 of 5 accounts balanced")
5. Verify "View Details →" link goes to /reconciliation
6. Take screenshot: dashboard-reconciliation-status.png
```

### Test #55: Dashboard card styling consistency
```
1. On dashboard page
2. Verify all cards have consistent:
   - Border radius (rounded corners)
   - Shadow depth
   - Spacing between cards
   - Internal padding
3. Visual inspection - should look polished, not misaligned
4. Take screenshot: dashboard-styling.png
```

### Test #56: Dashboard responsive layout
```
1. Resize browser to desktop (1920px)
   - Cards should display in 3-column grid
   - Take screenshot: dashboard-desktop.png

2. Resize to tablet (768px)
   - Cards should reflow appropriately
   - Take screenshot: dashboard-tablet.png

3. Resize to mobile (375px)
   - Cards should stack vertically
   - All content should remain readable
   - Take screenshot: dashboard-mobile.png
```

## Update feature_list.json

**After ALL verifications pass**, update these tests to `"passes": true`:

### From Session 18 (Reconciliation)
- Test #36: "System computes expected balance for an account based on transactions"
- Test #37: "System calculates variance (recorded minus computed) for each account per period"
- Test #38: "Account reconciliation shows variance in all three currencies (CAD, USD, COP)"
- Test #39: "Transactions must reference an account for reconciliation to work"

### From Session 19 (Dashboard)
- Test #48: "Dashboard shows summary cards for current period: total income, total expenses, net"
- Test #49: "Dashboard shows summary of account balances: total assets and total liabilities"
- Test #50: "Dashboard shows quick reconciliation status for current period"
- Test #55: "Dashboard cards use consistent spacing, shadows, and borders"
- Test #56: "Dashboard layout is responsive and adjusts to different screen sizes"

**DO NOT mark these as passing:**
- Test #51: Charts (not implemented)
- Test #52: Charts (not implemented)
- Test #53: Top spending categories (not implemented)
- Test #54: Recent activity feed (not implemented)

## Commit Verification Results

After updating feature_list.json:
```bash
git add feature_list.json
git commit -m "test: verify reconciliation and dashboard features (tests #36-39, #48-50, #55-56)

- All backend tests passing (48 total)
- All frontend tests passing
- Browser verification complete with screenshots
- 9 tests now passing (4 reconciliation + 5 dashboard)"
```

## If ANY Verification Fails

**DO NOT update feature_list.json.**

Instead:
1. Document the failure in a new file: VERIFICATION-FAILURES.md
2. Debug and fix the issue
3. Re-run the specific test that failed
4. Only after ALL tests pass, update feature_list.json

## After Successful Verification

Update progress notes:
- Tests passing: 44 of 175 (35 previous + 9 new)
- Tests remaining: 131

Then proceed to next feature implementation:
1. Income entry UI (tests #42-44)
2. Exchange rates UI (tests #108-110)
3. Or continue with other dashboard features if needed
