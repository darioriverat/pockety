<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seed all 45 active expense categories from the specification.
     * C040 is marked as retired (merged into C031).
     */
    public function run(): void
    {
        $categories = [
            ['code' => 'C001', 'name_es' => 'MERCADO', 'name_en' => 'Groceries', 'is_debt_category' => false],
            ['code' => 'C002', 'name_es' => 'REPOSTERÍA', 'name_en' => 'Baking Supplies', 'is_debt_category' => false],
            ['code' => 'C003', 'name_es' => 'ARTESANÍAS', 'name_en' => 'Crafts & Handicrafts', 'is_debt_category' => false],
            ['code' => 'C004', 'name_es' => 'TRANSPORTES', 'name_en' => 'Transportation', 'is_debt_category' => false],
            ['code' => 'C005', 'name_es' => 'HOGAR', 'name_en' => 'Household', 'is_debt_category' => false],
            ['code' => 'C006', 'name_es' => 'COMIDAS CALLE', 'name_en' => 'Dining Out / Takeout', 'is_debt_category' => false],
            ['code' => 'C007', 'name_es' => 'JUGUETES NIÑAS', 'name_en' => 'Kids\' Toys', 'is_debt_category' => false],
            ['code' => 'C008', 'name_es' => 'SERVICIOS', 'name_en' => 'Utilities', 'is_debt_category' => false],
            ['code' => 'C009', 'name_es' => 'CRÉDITO DAVIVIENDA', 'name_en' => 'Davivienda Credit Payment', 'is_debt_category' => true],
            ['code' => 'C010', 'name_es' => 'CRÉDITO ÉXITO', 'name_en' => 'Éxito Store-Card Payment', 'is_debt_category' => true],
            ['code' => 'C011', 'name_es' => 'NUBE', 'name_en' => 'Cloud Storage/Services', 'is_debt_category' => false],
            ['code' => 'C012', 'name_es' => 'ARRIENDO', 'name_en' => 'Rent', 'is_debt_category' => false],
            ['code' => 'C013', 'name_es' => 'CELEBRACIONES Y RECREACIÓN', 'name_en' => 'Celebrations & Entertainment', 'is_debt_category' => false],
            ['code' => 'C014', 'name_es' => 'GASTOS MÉDICOS', 'name_en' => 'Medical Expenses', 'is_debt_category' => false],
            ['code' => 'C015', 'name_es' => 'PAGO DIANA', 'name_en' => 'Payment to Diana (personal transfer)', 'is_debt_category' => false],
            ['code' => 'C016', 'name_es' => 'CONFECCIONES', 'name_en' => 'Clothing/Garment Making', 'is_debt_category' => false],
            ['code' => 'C017', 'name_es' => 'GASTOS FINANCIEROS', 'name_en' => 'Bank/Financial Fees', 'is_debt_category' => false],
            ['code' => 'C018', 'name_es' => 'DEUDAS MENORES', 'name_en' => 'Minor Debts', 'is_debt_category' => false],
            ['code' => 'C019', 'name_es' => 'ROPA Y CALZADO', 'name_en' => 'Clothing & Footwear', 'is_debt_category' => false],
            ['code' => 'C020', 'name_es' => 'ESTUDIO Y COLEGIATURA', 'name_en' => 'Education & Tuition', 'is_debt_category' => false],
            ['code' => 'C021', 'name_es' => 'CUIDADO PERSONAL Y BELLEZA', 'name_en' => 'Personal Care & Beauty', 'is_debt_category' => false],
            ['code' => 'C022', 'name_es' => 'SEGURO DE VIDA', 'name_en' => 'Life Insurance', 'is_debt_category' => false],
            ['code' => 'C023', 'name_es' => 'INVERSIONES', 'name_en' => 'Investments', 'is_debt_category' => false],
            ['code' => 'C024', 'name_es' => 'MARKETING', 'name_en' => 'Marketing', 'is_debt_category' => false],
            ['code' => 'C025', 'name_es' => 'ASEO', 'name_en' => 'Cleaning Supplies', 'is_debt_category' => false],
            ['code' => 'C026', 'name_es' => 'GASTOS VIAJES', 'name_en' => 'Travel Expenses', 'is_debt_category' => false],
            ['code' => 'C027', 'name_es' => 'CRÉDITO OCCIDENTE', 'name_en' => 'Banco de Occidente Credit Payment', 'is_debt_category' => true],
            ['code' => 'C028', 'name_es' => 'CURSO AUTOMOVILISMO', 'name_en' => 'Motorsport/Driving Course', 'is_debt_category' => false],
            ['code' => 'C029', 'name_es' => 'COSTOS VEHÍCULO', 'name_en' => 'Vehicle Costs (fuel, parking, upkeep)', 'is_debt_category' => false],
            ['code' => 'C030', 'name_es' => 'PROPINAS', 'name_en' => 'Tips', 'is_debt_category' => false],
            ['code' => 'C031', 'name_es' => 'MESADA NIÑAS', 'name_en' => 'Kids\' Allowance', 'is_debt_category' => false],
            ['code' => 'C032', 'name_es' => 'ESTUDIOS ADULTOS', 'name_en' => 'Adult Education', 'is_debt_category' => false],
            ['code' => 'C033', 'name_es' => 'TECNOLOGIA, GAME CONSOLES, GAMES', 'name_en' => 'Technology & Gaming', 'is_debt_category' => false],
            ['code' => 'C034', 'name_es' => 'PILA', 'name_en' => 'Colombian Social Security Contribution (PILA)', 'is_debt_category' => false],
            ['code' => 'C035', 'name_es' => 'TRAMITES Y GASTOS MIGRACIÓN', 'name_en' => 'Immigration Procedures & Fees', 'is_debt_category' => false],
            ['code' => 'C036', 'name_es' => 'AYUDAS FAMILIA', 'name_en' => 'Family Financial Support', 'is_debt_category' => false],
            ['code' => 'C037', 'name_es' => 'HOTEL Y ESTADIA', 'name_en' => 'Hotel & Lodging', 'is_debt_category' => false],
            ['code' => 'C038', 'name_es' => 'CRÉDITO BANCOLOMBIA', 'name_en' => 'Bancolombia Credit Card Payment', 'is_debt_category' => true],
            ['code' => 'C039', 'name_es' => 'CREDITO CIBC', 'name_en' => 'CIBC Credit Card Payment', 'is_debt_category' => true],
            // C040 is retired and merged into C031
            ['code' => 'C040', 'name_es' => 'MESADA NIÑAS', 'name_en' => 'Kids\' Allowance', 'is_debt_category' => false, 'is_active' => false, 'status' => 'retired_merged_into_C031'],
            ['code' => 'C041', 'name_es' => 'PAGO MAMI', 'name_en' => 'Payment to Mom (family transfer)', 'is_debt_category' => false],
            ['code' => 'C042', 'name_es' => 'TAXES', 'name_en' => 'Taxes', 'is_debt_category' => false],
            ['code' => 'C043', 'name_es' => 'INSTRUMENTOS Y CLASES DE MUSICA', 'name_en' => 'Music Instruments & Lessons', 'is_debt_category' => false],
            ['code' => 'C044', 'name_es' => 'CREDITO FORD ESCAPE', 'name_en' => 'Ford Escape Auto Loan Payment', 'is_debt_category' => true],
            ['code' => 'C045', 'name_es' => 'DEPRECIACIONES', 'name_en' => 'Depreciation', 'is_debt_category' => false],
            ['code' => 'C046', 'name_es' => 'CREDITO CANADIAN TIRE MC', 'name_en' => 'Canadian Tire Mastercard Payment', 'is_debt_category' => true],
        ];

        foreach ($categories as $category) {
            Category::create([
                'code' => $category['code'],
                'name_es' => $category['name_es'],
                'name_en' => $category['name_en'],
                'is_debt_category' => $category['is_debt_category'],
                'is_active' => $category['is_active'] ?? true,
                'status' => $category['status'] ?? null,
            ]);
        }

        $this->command->info('Successfully seeded 46 categories (45 active + 1 retired)');
    }
}
