<?php

namespace App\Support;

use App\Models\Category;

/**
 * Household category template shared by seeders and registration.
 */
final class CategoryTemplate
{
    /**
     * @return list<array{
     *     code: string,
     *     name: string,
     *     is_debt_category: bool,
     *     is_income_category?: bool,
     *     is_active?: bool,
     *     status?: string
     * }>
     */
    public static function definitions(): array
    {
        return [
            ['code' => 'C001', 'name' => 'Groceries', 'is_debt_category' => false, 'is_income_category' => false],
            ['code' => 'C002', 'name' => 'Baking Supplies', 'is_debt_category' => false],
            ['code' => 'C003', 'name' => 'Crafts & Handicrafts', 'is_debt_category' => false],
            ['code' => 'C004', 'name' => 'Transportation', 'is_debt_category' => false],
            ['code' => 'C005', 'name' => 'Household', 'is_debt_category' => false],
            ['code' => 'C006', 'name' => 'Dining Out / Takeout', 'is_debt_category' => false],
            ['code' => 'C007', 'name' => 'Kids\' Toys', 'is_debt_category' => false],
            ['code' => 'C008', 'name' => 'Utilities', 'is_debt_category' => false],
            ['code' => 'C009', 'name' => 'Davivienda Credit Payment', 'is_debt_category' => true],
            ['code' => 'C010', 'name' => 'Exito Store-Card Payment', 'is_debt_category' => true],
            ['code' => 'C011', 'name' => 'Cloud Storage/Services', 'is_debt_category' => false],
            ['code' => 'C012', 'name' => 'Rent', 'is_debt_category' => false],
            ['code' => 'C013', 'name' => 'Celebrations & Entertainment', 'is_debt_category' => false],
            ['code' => 'C014', 'name' => 'Medical Expenses', 'is_debt_category' => false],
            ['code' => 'C015', 'name' => 'Payment to Diana (personal transfer)', 'is_debt_category' => false],
            ['code' => 'C016', 'name' => 'Clothing/Garment Making', 'is_debt_category' => false],
            ['code' => 'C017', 'name' => 'Bank/Financial Fees', 'is_debt_category' => false],
            ['code' => 'C018', 'name' => 'Minor Debts', 'is_debt_category' => false],
            ['code' => 'C019', 'name' => 'Clothing & Footwear', 'is_debt_category' => false],
            ['code' => 'C020', 'name' => 'Education & Tuition', 'is_debt_category' => false],
            ['code' => 'C021', 'name' => 'Personal Care & Beauty', 'is_debt_category' => false],
            ['code' => 'C022', 'name' => 'Life Insurance', 'is_debt_category' => false],
            ['code' => 'C023', 'name' => 'Investments', 'is_debt_category' => false],
            ['code' => 'C024', 'name' => 'Marketing', 'is_debt_category' => false],
            ['code' => 'C025', 'name' => 'Cleaning Supplies', 'is_debt_category' => false],
            ['code' => 'C026', 'name' => 'Travel Expenses', 'is_debt_category' => false],
            ['code' => 'C027', 'name' => 'Banco de Occidente Credit Payment', 'is_debt_category' => true],
            ['code' => 'C028', 'name' => 'Motorsport/Driving Course', 'is_debt_category' => false],
            ['code' => 'C029', 'name' => 'Vehicle Costs (fuel, parking, upkeep)', 'is_debt_category' => false],
            ['code' => 'C030', 'name' => 'Tips', 'is_debt_category' => false],
            ['code' => 'C031', 'name' => 'Kids\' Allowance', 'is_debt_category' => false],
            ['code' => 'C032', 'name' => 'Adult Education', 'is_debt_category' => false],
            ['code' => 'C033', 'name' => 'Technology & Gaming', 'is_debt_category' => false],
            ['code' => 'C034', 'name' => 'Colombian Social Security Contribution (PILA)', 'is_debt_category' => false],
            ['code' => 'C035', 'name' => 'Immigration Procedures & Fees', 'is_debt_category' => false],
            ['code' => 'C036', 'name' => 'Family Financial Support', 'is_debt_category' => false],
            ['code' => 'C037', 'name' => 'Hotel & Lodging', 'is_debt_category' => false],
            ['code' => 'C038', 'name' => 'Bancolombia Credit Card Payment', 'is_debt_category' => true],
            ['code' => 'C039', 'name' => 'CIBC Credit Card Payment', 'is_debt_category' => true],
            ['code' => 'C040', 'name' => 'Kids\' Allowance', 'is_debt_category' => false, 'is_active' => false, 'status' => 'retired_merged_into_C031'],
            ['code' => 'C041', 'name' => 'Payment to Mom (family transfer)', 'is_debt_category' => false],
            ['code' => 'C042', 'name' => 'Taxes', 'is_debt_category' => false],
            ['code' => 'C043', 'name' => 'Music Instruments & Lessons', 'is_debt_category' => false],
            ['code' => 'C044', 'name' => 'Ford Escape Auto Loan Payment', 'is_debt_category' => true],
            ['code' => 'C045', 'name' => 'Depreciation', 'is_debt_category' => false],
            ['code' => 'C046', 'name' => 'Canadian Tire Mastercard Payment', 'is_debt_category' => true],
            ['code' => 'I01', 'name' => 'Salary', 'is_debt_category' => false, 'is_income_category' => true],
        ];
    }

    /**
     * Apply the template for one user, matching by (user_id, code).
     * Does not steal or reassign rows that belong to another user.
     */
    public static function seedForUser(int $userId): void
    {
        foreach (self::definitions() as $category) {
            Category::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'code' => $category['code'],
                ],
                [
                    'name' => $category['name'],
                    'is_debt_category' => $category['is_debt_category'],
                    'is_income_category' => $category['is_income_category'] ?? false,
                    'is_active' => $category['is_active'] ?? true,
                    'status' => $category['status'] ?? null,
                ]
            );
        }
    }
}
