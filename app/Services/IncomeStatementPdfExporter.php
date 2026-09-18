<?php

namespace App\Services;

use App\Support\SimplePdf;

class IncomeStatementPdfExporter
{
    private const COL_LABEL = 320.0;

    private const COL_AMOUNT = 180.0;

    /**
     * @param  array{
     *     period: string,
     *     total_income_cad: float,
     *     total_recorded_disbursements_cad: float,
     *     net_operating_expenses_cad: float,
     *     net_cad: float,
     *     income_lines: list<array{
     *         description: string,
     *         line_number: int,
     *         amount_cad: float,
     *         amount_usd: float,
     *         amount_cop: float,
     *         total_cad_equivalent: float
     *     }>,
     *     category_totals: list<array{
     *         category_code: string,
     *         category_name_es: string,
     *         category_name_en: string,
     *         total_cad: float,
     *         is_debt_category: bool,
     *         is_income_category?: bool,
     *         is_depreciation: bool
     *     }>
     * }  $statement
     */
    public function export(array $statement): string
    {
        $pdf = new SimplePdf;
        $periodLabel = $this->formatPeriod($statement['period']);

        $pdf->title('Pockety — Income Statement');
        $pdf->subtitle('Period: '.$periodLabel.' ('.$statement['period'].')');
        $pdf->subtitle('All amounts shown as CAD equivalents');
        $pdf->blank(10);

        $pdf->heading('Income');
        $this->writeAmountHeader($pdf, 'Description');
        if ($statement['income_lines'] === []) {
            $pdf->text('No income line items for this period');
        } else {
            foreach ($statement['income_lines'] as $line) {
                $pdf->row([
                    [
                        'text' => sprintf(
                            '%d. %s',
                            $line['line_number'],
                            $line['description']
                        ),
                        'width' => self::COL_LABEL,
                    ],
                    [
                        'text' => $this->formatMoney((float) $line['total_cad_equivalent']),
                        'width' => self::COL_AMOUNT,
                        'align' => 'right',
                    ],
                ]);
            }
        }
        $pdf->row([
            ['text' => 'Total Income', 'width' => self::COL_LABEL, 'bold' => true],
            [
                'text' => $this->formatMoney((float) $statement['total_income_cad']),
                'width' => self::COL_AMOUNT,
                'align' => 'right',
                'bold' => true,
            ],
        ]);
        $pdf->blank(12);

        $pdf->heading('Expenses by Category');
        $this->writeAmountHeader($pdf, 'Category');
        $expenseRows = array_values(array_filter(
            $statement['category_totals'],
            fn (array $row): bool => (float) $row['total_cad'] > 0.0
                && empty($row['is_income_category'])
        ));

        if ($expenseRows === []) {
            $pdf->text('No expenses recorded for this period');
        } else {
            foreach ($expenseRows as $row) {
                $flags = [];
                if ($row['is_debt_category']) {
                    $flags[] = 'debt';
                }
                if ($row['is_depreciation']) {
                    $flags[] = 'depr';
                }
                $suffix = $flags === [] ? '' : ' ('.implode(', ', $flags).')';
                $pdf->row([
                    [
                        'text' => $row['category_code'].' '.$row['category_name_es'].$suffix,
                        'width' => self::COL_LABEL,
                    ],
                    [
                        'text' => $this->formatMoney((float) $row['total_cad']),
                        'width' => self::COL_AMOUNT,
                        'align' => 'right',
                    ],
                ]);
            }
        }
        $pdf->row([
            [
                'text' => 'Total Recorded Disbursements',
                'width' => self::COL_LABEL,
                'bold' => true,
            ],
            [
                'text' => $this->formatMoney((float) $statement['total_recorded_disbursements_cad']),
                'width' => self::COL_AMOUNT,
                'align' => 'right',
                'bold' => true,
            ],
        ]);
        $pdf->row([
            [
                'text' => 'Net Operating Expenses',
                'width' => self::COL_LABEL,
                'bold' => true,
            ],
            [
                'text' => $this->formatMoney((float) $statement['net_operating_expenses_cad']),
                'width' => self::COL_AMOUNT,
                'align' => 'right',
                'bold' => true,
            ],
        ]);
        $pdf->blank(12);

        $pdf->heading('Net');
        $this->writeAmountHeader($pdf, 'Item');
        $pdf->row([
            ['text' => 'Total Income', 'width' => self::COL_LABEL],
            [
                'text' => $this->formatMoney((float) $statement['total_income_cad']),
                'width' => self::COL_AMOUNT,
                'align' => 'right',
            ],
        ]);
        $pdf->row([
            ['text' => 'Less: Net Operating Expenses', 'width' => self::COL_LABEL],
            [
                'text' => $this->formatMoney((float) $statement['net_operating_expenses_cad']),
                'width' => self::COL_AMOUNT,
                'align' => 'right',
            ],
        ]);
        $pdf->row([
            ['text' => 'Net', 'width' => self::COL_LABEL, 'bold' => true],
            [
                'text' => $this->formatMoney((float) $statement['net_cad']),
                'width' => self::COL_AMOUNT,
                'align' => 'right',
                'bold' => true,
            ],
        ]);

        return $pdf->render();
    }

    private function writeAmountHeader(SimplePdf $pdf, string $label): void
    {
        $pdf->row([
            ['text' => $label, 'width' => self::COL_LABEL, 'bold' => true],
            ['text' => 'CAD', 'width' => self::COL_AMOUNT, 'align' => 'right', 'bold' => true],
        ], 9.0);
    }

    private function formatPeriod(string $period): string
    {
        if (! preg_match('/^\d{6}$/', $period)) {
            return $period;
        }

        $year = (int) substr($period, 0, 4);
        $month = (int) substr($period, 4, 2);
        $months = [
            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December',
        ];

        return ($months[$month] ?? $period).' '.$year;
    }

    private function formatMoney(float $value): string
    {
        return number_format($value, 2, '.', ',');
    }
}
