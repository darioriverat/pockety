# Browser Testing Plan - Pockety
## Session 3 - Browser Automation Required

### Prerequisites
✅ Docker containers running
✅ Application accessible at http://dev.pockety.com:8080
✅ Frontend assets built (Vite)
✅ Database seeded with categories and test users
✅ API endpoints working

### Test Users Available
- **Email**: test@example.com
- **Email**: admin@example.com
- **Password**: (needs to be verified or reset)

### Test Plan

#### Feature 1: Dashboard Access
**Test ID**: Feature #1 from feature_list.json
**Status**: Ready for browser testing

Steps:
1. Navigate to http://dev.pockety.com:8080/
2. If redirected to login, login with test user
3. Verify dashboard loads without errors
4. Take screenshot
5. Check console for errors

Expected:
- Page loads successfully
- Navigation menu visible
- No console errors

---

#### Feature 2: Display All 45 Active Categories
**Test ID**: Feature #2 from feature_list.json
**Status**: Ready for browser testing

Steps:
1. From dashboard, click "Categories" in sidebar navigation
2. Wait for page to load
3. Verify "Total categories: 45" is displayed
4. Count category cards visually
5. Verify C040 is NOT in the list
6. Verify C031 (MESADA NIÑAS) appears only once
7. Take screenshot
8. Check console for errors

Expected:
- Exactly 45 category cards displayed
- C040 not present
- C031 appears once
- Responsive grid layout (2-3 columns)
- No console errors

API Verification (already passed):
```bash
curl http://dev.pockety.com:8080/api/categories | jq '.meta.total'
# Returns: 45
```

---

#### Feature 3: Spanish and English Names Displayed
**Test ID**: Feature #3 from feature_list.json
**Status**: Ready for browser testing

Steps:
1. On categories page, locate category C001
2. Verify Spanish name "MERCADO" is visible with "ES:" prefix
3. Verify English name "Groceries" is visible with "EN:" prefix
4. Check several other categories for same pattern
5. Take screenshot showing a category card with both names
6. Check console for errors

Expected:
- Both names visible on each card
- Format: "ES: MERCADO" and "EN: Groceries"
- Text is readable and properly styled

Sample categories to verify:
- C001: MERCADO / Groceries
- C004: TRANSPORTES / Transportation
- C012: ARRIENDO / Rent
- C019: ROPA Y CALZADO / Clothing & Footwear

---

#### Feature 4: Debt Categories Have Special Indicator
**Test ID**: Feature #4 from feature_list.json
**Status**: Ready for browser testing

Steps:
1. On categories page, locate category C009 (CRÉDITO DAVIVIENDA)
2. Verify it has a "Debt" badge (grey/secondary variant)
3. Verify all 7 debt categories have the badge:
   - C009: CRÉDITO DAVIVIENDA
   - C010: CRÉDITO ÉXITO
   - C027: CRÉDITO OCCIDENTE
   - C038: CRÉDITO BANCOLOMBIA
   - C039: CREDITO CIBC
   - C044: CREDITO FORD ESCAPE
   - C046: CREDITO CANADIAN TIRE MC
4. Verify non-debt category (e.g., C001) does NOT have debt badge
5. Take screenshot showing both debt and non-debt categories
6. Check console for errors

Expected:
- "Debt" badge visible on exactly 7 categories
- Badge appears in top-right of card
- Non-debt categories do not have the badge
- Badge styling is consistent

API Verification (already passed):
```bash
curl http://dev.pockety.com:8080/api/categories | jq '.data[] | select(.is_debt_category == true) | .code'
# Returns: C009, C010, C027, C038, C039, C044, C046 (7 total)
```

---

### Commands for Browser Automation

When puppeteer tools become available, use these commands:

```bash
# Start browser session
puppeteer_navigate --url "http://dev.pockety.com:8080"

# Login (if required)
puppeteer_fill --selector "input[name='email']" --value "test@example.com"
puppeteer_fill --selector "input[name='password']" --value "password"
puppeteer_click --selector "button[type='submit']"

# Navigate to categories
puppeteer_click --selector "a[href='/categories']"

# Take screenshot
puppeteer_screenshot --path "categories-page.png"

# Check console errors
# (Check console output from browser)
```

### Completion Criteria

Only mark features as "passes": true in feature_list.json when:
1. ✅ Screenshots taken showing working UI
2. ✅ All test steps completed successfully
3. ✅ No console errors observed
4. ✅ Visual appearance matches design expectations
5. ✅ All specified elements visible and functional

### Notes

- Backend API is fully functional and verified
- Frontend React component is properly structured
- Only UI/browser testing remains
- No code changes needed - only verification

---

**Created**: Session 3
**Last Updated**: 2026-09-13
