import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FinancialSummary from './financial-summary';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
}));

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

describe('FinancialSummary income statement PDF export', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows Export to PDF and navigates to the export endpoint', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: {
                        period: '202501',
                        total_income_cad: 5000,
                        total_recorded_disbursements_cad: 725,
                        net_operating_expenses_cad: 150,
                        net_cad: 4850,
                        debt_principal_excluded_cad: 500,
                        depreciation_excluded_cad: 75,
                        debt_interest_included_cad: 50,
                        debt_payments_excluded_cad: 0,
                        income_lines: [
                            {
                                id: 1,
                                description: 'Salary',
                                line_number: 1,
                                amount_cad: 5000,
                                amount_usd: 0,
                                amount_cop: 0,
                                total_cad_equivalent: 5000,
                            },
                        ],
                        category_totals: [
                            {
                                category_id: 1,
                                category_code: 'C001',
                                category_name_es: 'MERCADO',
                                category_name_en: 'Groceries',
                                is_debt_category: false,
                                is_depreciation: false,
                                total_cad: 100,
                                principal_cad: 0,
                                interest_cad: 0,
                                other_cad: 100,
                            },
                        ],
                    },
                }),
            }),
        );

        let hrefValue = '';
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                get href() {
                    return hrefValue;
                },
                set href(value: string) {
                    hrefValue = value;
                },
            },
        });

        render(<FinancialSummary />);

        await waitFor(() => {
            expect(screen.getByTestId('total-income')).toBeInTheDocument();
        });

        expect(screen.getByTestId('income-statement-net')).toHaveTextContent(
            '4,850',
        );
        expect(screen.getByTestId('income-lines-table')).toBeInTheDocument();

        const exportButton = screen.getByTestId('export-income-statement-pdf');
        expect(exportButton).toHaveTextContent('Export to PDF');

        fireEvent.click(exportButton);

        expect(hrefValue).toBe(
            '/api/financial-summary/export?period=202501',
        );
    });
});
