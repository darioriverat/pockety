# Feature #95: Account Name Uniqueness Validation

## Implementation Summary

### Backend Changes
1. **AccountController.php**
   - Added `unique:accounts,name` validation to `store()` method
   - Added `unique:accounts,name,{id}` validation to `update()` method
   - Custom error message: "An account with this name already exists."

2. **AccountValidationTest.php** (new file)
   - `test_account_name_must_be_unique()` - ✅ PASS
   - `test_account_name_can_be_reused_after_deactivation()` - Documents current behavior
   - `test_account_can_update_with_same_name()` - ✅ PASS
   - `test_account_cannot_update_to_existing_name()` - ✅ PASS
   - `test_unique_account_names_are_accepted()` - ✅ PASS

### Frontend Changes
- No changes needed - accounts.tsx already handles API validation errors correctly
- Error display: Lines 168-172 and 512-516

### Browser Tests
- Added `feature 95` test to `tests/browser/accounts.spec.ts`
- Tests all 5 steps from feature_list.json

## API Verification (via curl)

All API endpoints tested and working correctly:

1. ✅ POST /api/accounts - Duplicate rejected
2. ✅ POST /api/accounts - Unique accepted  
3. ✅ PATCH /api/accounts/{id} - Same name allowed
4. ✅ PATCH /api/accounts/{id} - Duplicate rejected

## Browser Verification Status

⚠️ **PENDING**: Browser automation tools (Puppeteer, Playwright) are blocked in current sandbox.

**Next Steps:**
Run browser test to verify UI behavior:
```bash
npx playwright test tests/browser/accounts.spec.ts --grep "feature 95"
```

## Expected Behavior

1. Create account "RBC Checking" → Success
2. Attempt duplicate "RBC Checking" → Error shown in dialog
3. Dialog remains open with error message
4. Change name to "RBC Savings" → Success
5. Both accounts visible in list
