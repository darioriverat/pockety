# Auth Test Issue

## Status: Known Issue - Not Blocking Pockety Development

### Summary
18 tests from the Laravel starter kit's Auth/Settings suite are failing with authentication/session issues.

### Test Results (Session 29 - Sep 15, 2026)
- ✅ **Pockety Finance Tests:** 75/75 passing
- ❌ **Starter Kit Auth Tests:** 18/18 failing
- ✅ **Frontend Unit Tests:** 19/19 passing
- ✅ **Application:** Running and accessible (HTTP 200)

### Failing Tests
All failures in:
- `Tests\Feature\Auth\AuthenticationTest`
- `Tests\Feature\Auth\PasswordResetTest`
- `Tests\Feature\Auth\RegistrationTest`
- `Tests\Feature\Auth\TwoFactorChallengeTest`
- `Tests\Feature\Auth\VerificationNotificationTest`
- `Tests\Feature\Settings\ProfileUpdateTest`
- `Tests\Feature\Settings\SecurityTest`

### Root Cause
The tests fail because they test Laravel Fortify authentication flows using `$this->post()` for web routes, which require proper CSRF and session handling. Changed `SESSION_DRIVER` from `array` to `cookie` in `phpunit.xml`, which fixed CSRF 419 errors, but authentication itself still fails.

### Investigation Done
1. ✅ Created `tests/CreatesApplication.php` trait
2. ✅ Updated `tests/TestCase.php` to use CreatesApplication
3. ✅ Changed SESSION_DRIVER to 'cookie' in phpunit.xml
4. ✅ Verified UserFactory properly hashes passwords
5. ✅ Verified Fortify is properly configured
6. ✅ Verified all Pockety-specific tests pass

### Decision
These tests came unchanged from the `laravel-react-starter-kit` and were never verified as working in previous sessions. They test authentication features (login, registration, password reset) that are not part of the core Pockety finance tracking functionality.

**All Pockety finance features are fully tested and passing.**

### Next Steps
- Continue implementing Pockety features (tests #73+)
- Revisit Auth tests after core Pockety features are complete
- May require deeper investigation into Fortify + Inertia + session configuration for testing

### Files Modified
- `tests/CreatesApplication.php` (created)
- `tests/TestCase.php` (added CreatesApplication trait)
- `phpunit.xml` (changed SESSION_DRIVER to 'cookie')
