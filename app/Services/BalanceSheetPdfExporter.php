<?php

namespace App\Services;

use App\Support\SimplePdf;

class BalanceSheetPdfExporter
{
    private const COL_NAME = 170.0;

    private const COL_TYPE = 70.0;

    private const COL_CAD = 85.0;

    private const COL_USD = 85.0;

    private const COL_COP = 90.0;

    /**
     * @param  array{
     *     period: string,
     *     total_assets: array{
     *         cad: float,
     *         usd: float,
     *         cop: float,
     *         accounts_cad: float,
     *         fixed_assets_cad: float,
     *         breakdown: list<array<string, mixed>>
     *     },
     *     total_liabilities: array{
     *         cad: float,
     *         usd: float,
     *         cop: float,
     *         breakdown: list<array<string, mixed>>
     *     },
     *     equity: array{cad: float, usd: float, cop: float},
     *     exchange_rates: array{usd_cop: float, usd_cad: float, cad_cop: float}
     * }  $sheet
     */
    public function export(array $sheet): string
    {
        $pdf = new SimplePdf;
        $periodLabel = $this->formatPeriod($sheet['period']);

        $pdf->title('Pockety — Balance Sheet');
        $pdf->subtitle('Period: '.$periodLabel.' ('.$sheet['period'].')');
        $pdf->subtitle(sprintf(
            'Exchange rates — USD/CAD %s · CAD/COP %s · USD/COP %s',
            $this->formatNumber($sheet['exchange_rates']['usd_cad'], 4),
            $this->formatNumber($sheet['exchange_rates']['cad_cop'], 2),
            $this->formatNumber($sheet['exchange_rates']['usd_cop'], 2)
        ));
        $pdf->blank(10);

        $pdf->heading('Assets');
        $this->writeTableHeader($pdf);
        foreach ($sheet['total_assets']['breakdown'] as $row) {
            $this->writeLineRow(
                $pdf,
                (string) $row['name'],
                $this->typeLabel((string) $row['type']),
                (float) $row['cad'],
                (float) $row['usd'],
                (float) $row['cop'],
            );
        }
        if ($sheet['total_assets']['breakdown'] === []) {
            $pdf->text('No asset balances for this period');
        }
        $this->writeTotalRow(
            $pdf,
            'Total Assets',
            (float) $sheet['total_assets']['cad'],
            (float) $sheet['total_assets']['usd'],
            (float) $sheet['total_assets']['cop'],
        );
        $pdf->text(
            sprintf(
                'Accounts: %s CAD · Fixed assets: %s CAD',
                $this->formatMoney((float) $sheet['total_assets']['accounts_cad']),
                $this->formatMoney((float) $sheet['total_assets']['fixed_assets_cad'])
            ),
            false,
            9.0
        );
        $pdf->blank(12);

        $pdf->heading('Liabilities');
        $this->writeTableHeader($pdf);
        foreach ($sheet['total_liabilities']['breakdown'] as $row) {
            $this->writeLineRow(
                $pdf,
                (string) $row['name'],
                $this->typeLabel((string) $row['type']),
                (float) $row['cad'],
                (float) $row['usd'],
                (float) $row['cop'],
            );
        }
        if ($sheet['total_liabilities']['breakdown'] === []) {
            $pdf->text('No liability balances for this period');
        }
        $this->writeTotalRow(
            $pdf,
            'Total Liabilities',
            (float) $sheet['total_liabilities']['cad'],
            (float) $sheet['total_liabilities']['usd'],
            (float) $sheet['total_liabilities']['cop'],
        );
        $pdf->blank(12);

        $pdf->heading('Equity');
        $this->writeTableHeader($pdf);
        $this->writeTotalRow(
            $pdf,
            'Equity (Assets − Liabilities)',
            (float) $sheet['equity']['cad'],
            (float) $sheet['equity']['usd'],
            (float) $sheet['equity']['cop'],
        );
        $pdf->blank(14);

        $pdf->heading('Summary');
        $this->writeTableHeader($pdf, includeType: false);
        $this->writeSummaryRow($pdf, 'Assets', $sheet['total_assets']);
        $this->writeSummaryRow($pdf, 'Liabilities', $sheet['total_liabilities']);
        $this->writeSummaryRow($pdf, 'Equity', $sheet['equity'], bold: true);

        return $pdf->render();
    }

    private function writeTableHeader(SimplePdf $pdf, bool $includeType = true): void
    {
        if ($includeType) {
            $pdf->row([
                ['text' => 'Name', 'width' => self::COL_NAME, 'bold' => true],
                ['text' => 'Type', 'width' => self::COL_TYPE, 'bold' => true],
                ['text' => 'CAD', 'width' => self::COL_CAD, 'align' => 'right', 'bold' => true],
                ['text' => 'USD', 'width' => self::COL_USD, 'align' => 'right', 'bold' => true],
                ['text' => 'COP', 'width' => self::COL_COP, 'align' => 'right', 'bold' => true],
            ], 9.0);
        } else {
            $pdf->row([
                ['text' => 'Item', 'width' => self::COL_NAME + self::COL_TYPE, 'bold' => true],
                ['text' => 'CAD', 'width' => self::COL_CAD, 'align' => 'right', 'bold' => true],
                ['text' => 'USD', 'width' => self::COL_USD, 'align' => 'right', 'bold' => true],
                ['text' => 'COP', 'width' => self::COL_COP, 'align' => 'right', 'bold' => true],
            ], 9.0);
        }
    }

    private function writeLineRow(
        SimplePdf $pdf,
        string $name,
        string $type,
        float $cad,
        float $usd,
        float $cop,
    ): void {
        $pdf->row([
            ['text' => $name, 'width' => self::COL_NAME],
            ['text' => $type, 'width' => self::COL_TYPE],
            ['text' => $this->formatMoney($cad), 'width' => self::COL_CAD, 'align' => 'right'],
            ['text' => $this->formatMoney($usd), 'width' => self::COL_USD, 'align' => 'right'],
            ['text' => $this->formatMoney($cop, 0), 'width' => self::COL_COP, 'align' => 'right'],
        ]);
    }

    private function writeTotalRow(
        SimplePdf $pdf,
        string $label,
        float $cad,
        float $usd,
        float $cop,
    ): void {
        $pdf->row([
            ['text' => $label, 'width' => self::COL_NAME + self::COL_TYPE, 'bold' => true],
            ['text' => $this->formatMoney($cad), 'width' => self::COL_CAD, 'align' => 'right', 'bold' => true],
            ['text' => $this->formatMoney($usd), 'width' => self::COL_USD, 'align' => 'right', 'bold' => true],
            ['text' => $this->formatMoney($cop, 0), 'width' => self::COL_COP, 'align' => 'right', 'bold' => true],
        ]);
    }

    /**
     * @param  array{cad: float, usd: float, cop: float}  $totals
     */
    private function writeSummaryRow(
        SimplePdf $pdf,
        string $label,
        array $totals,
        bool $bold = false,
    ): void {
        $pdf->row([
            ['text' => $label, 'width' => self::COL_NAME + self::COL_TYPE, 'bold' => $bold],
            ['text' => $this->formatMoney($totals['cad']), 'width' => self::COL_CAD, 'align' => 'right', 'bold' => $bold],
            ['text' => $this->formatMoney($totals['usd']), 'width' => self::COL_USD, 'align' => 'right', 'bold' => $bold],
            ['text' => $this->formatMoney($totals['cop'], 0), 'width' => self::COL_COP, 'align' => 'right', 'bold' => $bold],
        ]);
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

    private function formatMoney(float $value, int $decimals = 2): string
    {
        return number_format($value, $decimals, '.', ',');
    }

    private function formatNumber(float $value, int $decimals): string
    {
        return number_format($value, $decimals, '.', '');
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'bank' => 'Bank',
            'investment' => 'Investment',
            'receivable' => 'Receivable',
            'fixed_asset' => 'Fixed asset',
            'liability' => 'Liability',
            default => $type,
        };
    }
}
