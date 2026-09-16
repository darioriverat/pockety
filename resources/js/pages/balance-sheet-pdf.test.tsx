import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BalanceSheet from './balance-sheet';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

describe('BalanceSheet PDF export', () => {
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
                        total_assets: {
                            cad: 1000,
                            usd: 750,
                            cop: 3000000,
                            accounts_cad: 1000,
                            fixed_assets_cad: 0,
                            breakdown: [],
                        },
                        total_liabilities: {
                            cad: 200,
                            usd: 150,
                            cop: 600000,
                            breakdown: [],
                        },
                        equity: {
                            cad: 800,
                            usd: 600,
                            cop: 2400000,
                        },
                        exchange_rates: {
                            usd_cop: 4400,
                            usd_cad: 0.75,
                            cad_cop: 3000,
                        },
                    },
                }),
            }),
        );

        const locationSpy = vi
            .spyOn(window, 'location', 'get')
            .mockReturnValue({
                ...window.location,
                href: '',
            } as Location);
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

        render(<BalanceSheet />);

        await waitFor(() => {
            expect(screen.getByTestId('total-assets-cad')).toBeInTheDocument();
        });

        const exportButton = screen.getByTestId('export-balance-sheet-pdf');
        expect(exportButton).toHaveTextContent('Export to PDF');

        fireEvent.click(exportButton);

        expect(hrefValue).toBe('/api/balance-sheet/export?period=202501');

        locationSpy.mockRestore();
    });
});
