# Session 21 Action Plan

## ⚠️ CRITICAL: Currency Bug Fix Completed

Session 20 found and fixed a **critical currency conversion bug** in the USD to CAD conversion logic.

**What was wrong:**
- USD to CAD was dividing instead of multiplying by the exchange rate
- Example: 100 USD with rate 0.75 was giving 133.33 CAD (wrong) instead of 75 CAD (correct)

**What was fixed:**
- `ExchangeRate::usdToCad()` - now multiplies by rate ✓
- `Income::getTotalCadEquivalent()` - now uses corrected method ✓

**Commit:** `ba5c24f` - "fix: correct USD to CAD currency conversion logic"

---

## Step 1: Verify Environment is Accessible

Before running ANY tests, confirm the environment works:

```bash
# Check Docker is running
docker ps | grep web_app

# If not running, start Docker Desktop or docker service
# Then check if app container exists
task shell

# Try accessing the app
curl -I http://dev.pockety.com:8080/
```

**If Docker/app is not accessible:** Document the blocker and focus on code review or planning.

---

## Step 2: Run Backend Tests (EXPECT FAILURES!)

```bash
task backend-tests
```

**Expected:** 48 tests total

**WARNING:** The currency bug fix will cause **different results** for any tests involving USD amounts!

If tests fail:
1. Check if failure is related to USD/CAD conversion expectations
2. Update test expectations if they were based on the OLD (wrong) conversion logic
3. Verify the NEW results are mathematically correct per the app spec
4. Fix any other issues found
5. Re-run until all pass

**Common issues to check:**
- Dashboard tests with USD income/expenses
- Any test creating USD transactions
- Exchange rate conversion tests (if any exist)

---

## Step 3: Run Frontend Tests

```bash
task frontend-tests
```

**Expected:** All existing tests + dashboard.test.tsx (12 tests)

If tests fail:
1. Read error messages carefully
2. Check for import/component issues
3. Fix and re-run

---

## Step 4: Browser Verification - Reconciliation (Tests #36-39)

Use Puppeteer tools to verify reconciliation feature works end-to-end:

### Test #36: Computed balance
```
1. Navigate to http://dev.pockety.com:8080/reconciliation
2. Enter period 202601 (or create test data for current period)
3. Verify "Computed" column shows calculated balances
4. Screenshot: reconciliation-computed-balance.png
```

### Test #37: Variance calculation
```
1. On reconciliation page
2. Verify "Variance" = Recorded - Computed
3. Verify variance coloring (red for non-zero, green for zero)
4. Screenshot: reconciliation-variance.png
```

### Test #38: Multi-currency display
```
1. On reconciliation page
2. Find account with balances in multiple currencies
3. Verify CAD, USD, COP rows all show recorded/computed/variance
4. Screenshot: reconciliation-multi-currency.png
```

### Test #39: Transaction account linkage
```
1. Navigate to /transactions
2. Click "Add Transaction"
3. Verify "Account" field exists
4. Create transaction with account selected
5. Verify transaction shows linked account
6. Screenshot: transaction-with-account.png
```

---

## Step 5: Browser Verification - Dashboard (Tests #48-56)

### Test #48: Income/Expenses/Net cards
```
1. Navigate to http://dev.pockety.com:8080/dashboard
2. Verify "Total Income", "Total Expenses", "Net" cards display
3. Verify amounts are properly formatted as currency
4. Verify Net card color (green for positive, red for negative)
5. Screenshot: dashboard-income-expenses-net.png
```

### Test #49: Assets/Liabilities/Equity cards
```
1. On dashboard
2. Verify "Total Assets", "Total Liabilities", "Equity" cards
3. Verify amounts are in CAD equivalent
4. Screenshot: dashboard-assets-liabilities.png
```

### Test #50: Reconciliation status
```
1. On dashboard
2. Verify "Reconciliation Status" displays
3. Verify shows "Balanced" or "Unbalanced" badge
4. Verify account counts (e.g., "5 of 5 accounts balanced")
5. Verify "View Details →" link goes to /reconciliation
6. Screenshot: dashboard-reconciliation-status.png
```

### Test #55: Styling consistency
```
1. Visual inspection of all cards
2. Check consistent borders, shadows, spacing, padding
3. Screenshot: dashboard-styling.png
```

### Test #56: Responsive layout
```
1. Desktop (1920px): Cards in 3-column grid
   Screenshot: dashboard-desktop.png

2. Tablet (768px): Cards reflow appropriately
   Screenshot: dashboard-tablet.png

3. Mobile (375px): Cards stack vertically
   Screenshot: dashboard-mobile.png
```

---

## Step 6: Update feature_list.json

**ONLY AFTER ALL TESTS PASS**, update these tests to `"passes": true`:

### Reconciliation (Session 18)
- Test #36: "System computes expected balance for an account based on transactions"
- Test #37: "System calculates variance (recorded minus computed) for each account per period"
- Test #38: "Account reconciliation shows variance in all three currencies (CAD, USD, COP)"
- Test #39: "Transactions must reference an account for reconciliation to work"

### Dashboard (Session 19)
- Test #48: "Dashboard shows summary cards for current period: total income, total expenses, net"
- Test #49: "Dashboard shows summary of account balances: total assets and total liabilities"
- Test #50: "Dashboard shows quick reconciliation status for current period"
- Test #55: "Dashboard cards use consistent spacing, shadows, and borders"
- Test #56: "Dashboard layout is responsive and adjusts to different screen sizes"

**DO NOT mark these as passing** (not implemented):
- Tests #51-54 (charts and additional dashboard features)

---

## Step 7: Commit Verification Results

```bash
git add feature_list.json
git commit -m "test: verify reconciliation and dashboard features (tests #36-39, #48-50, #55-56)

- Backend tests passing (48 total)
- Frontend tests passing
- Browser verification complete with screenshots
- Currency conversion bug fix verified working
- 9 tests now passing (4 reconciliation + 5 dashboard)
"
```

---

## Step 8: Update Progress Notes

```bash
# Update claude-progress.txt with:
# - Session 21 summary
# - Tests now passing: 44 of 175 (35 previous + 9 new)
# - Currency bug fix verified
# - Next features to implement
```

---

## If Verification Fails

**DO NOT update feature_list.json!**

Instead:
1. Create VERIFICATION-FAILURES.md documenting all failures
2. Fix the issues (prioritize currency-related failures)
3. Re-run tests
4. Only mark tests as passing once ALL verification succeeds

---

## After Successful Verification

Next features to implement (in priority order):
1. **Income entry UI** (tests #42-44) - Users can add/edit monthly income
2. **Exchange rates UI** (tests #108-110) - Users can set exchange rates per period
3. **Account list from source data** (test #40) - Display historical accounts
4. **Personal Loan CIBC fix** (test #41) - Correct naming

Choose ONE feature and complete it end-to-end (backend + frontend + tests + verification) before moving to the next.

---

## Key Reminders

1. The currency bug fix changes USD conversion results - test expectations may need updating
2. Do NOT implement new features until existing ones are verified
3. Take screenshots during browser verification
4. Run full test suite after any bug fixes
5. Commit working code frequently

---

## Session 20 Summary (For Context)

- **Environment:** Docker/Puppeteer inaccessible, no test execution possible
- **Achievement:** Found and fixed critical USD→CAD conversion bug
- **Code Review:** Thoroughly reviewed sessions 18-19 code - all well-structured
- **Status:** Reconciliation + Dashboard features code-complete, awaiting verification
- **Commits:** 2 (bug fix + progress notes)
