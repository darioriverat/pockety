import { test, expect } from '@playwright/test';
import { loginAsBrowserTestUser } from './helpers';

test.describe('Category 404 and Validation', () => {
    test('category not found returns 404 (Feature #20)', async ({
        page,
        request,
    }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: GET /api/categories/NONEXISTENT
        const getResponse = await request.get('/api/categories/NONEXISTENT');

        // Step 2: Verify response 404
        expect(getResponse.status()).toBe(404);

        // Step 3: PUT /api/categories/NONEXISTENT
        const putResponse = await request.put('/api/categories/NONEXISTENT', {
            data: { name: 'Test' },
        });

        // Step 4: Verify response 404
        expect(putResponse.status()).toBe(404);

        // Step 5: DELETE /api/categories/NONEXISTENT
        const deleteResponse = await request.delete(
            '/api/categories/NONEXISTENT',
        );

        // Step 6: Verify response 404
        expect(deleteResponse.status()).toBe(404);
    });

    test('validation errors for category creation (Feature #21)', async ({
        page,
        request,
    }) => {
        await loginAsBrowserTestUser(page, request);

        // Step 1: POST /api/categories with empty name
        const emptyNameResponse = await request.post('/api/categories', {
            data: {
                name: '',
                is_debt_category: false,
                is_income_category: false,
            },
        });

        // Step 2: Verify response 422 with name required error
        expect(emptyNameResponse.status()).toBe(422);
        const emptyNameBody = await emptyNameResponse.json();
        expect(emptyNameBody.errors?.name?.length).toBeGreaterThan(0);

        // Step 3: POST with name over 255 characters
        const longNameResponse = await request.post('/api/categories', {
            data: {
                name: 'a'.repeat(256), // 256 characters
                is_debt_category: false,
                is_income_category: false,
            },
        });

        // Step 4: Verify response 422
        expect(longNameResponse.status()).toBe(422);

        // Step 5: POST with missing is_debt_category
        const missingDebtResponse = await request.post('/api/categories', {
            data: {
                name: 'Test Category',
                is_income_category: false,
            },
        });

        // Step 6: Verify response 422
        expect(missingDebtResponse.status()).toBe(422);

        // Step 7: POST with missing is_income_category
        const missingIncomeResponse = await request.post('/api/categories', {
            data: {
                name: 'Test Category',
                is_debt_category: false,
            },
        });

        // Step 8: Verify response 422
        expect(missingIncomeResponse.status()).toBe(422);
    });
});
