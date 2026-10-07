import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PeriodBalances from './period-balances';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    usePage: () => ({ props: {} }),
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

const proposed = {
    period: '202501',
    assets_cad: 900,
    liabilities_cad: 0,
    equity_cad: 900,
    income_cad: 0,
    net_operating_expenses_cad: 100,
    records_check_result_cad: 0,
    reconciliation_status: 'unbalanced',
};

const registered = {
    ...proposed,
    id: 7,
    registered_at: '2026-01-15T12:00:00.000000Z',
    updated_at: '2026-01-15T12:00:00.000000Z',
};

function figureRow(amount: HTMLElement): HTMLElement {
    const row = amount.parentElement?.parentElement;
    if (!row) {
        throw new Error('Expected a figure row');
    }

    return row;
}

describe('PeriodBalances page', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows reconciliation figures and an empty registered balance', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: {
                        period: '202501',
                        proposed,
                        registered: null,
                        history: [],
                    },
                }),
            }),
        );

        render(<PeriodBalances />);

        await waitFor(() => {
            expect(screen.getByTestId('proposed-assets-cad')).toHaveTextContent(
                '$900.00',
            );
        });

        expect(screen.getByTestId('period-balances-heading')).toHaveTextContent(
            'Period Balances',
        );
        expect(screen.getByTestId('proposed-equity-cad')).toHaveTextContent(
            '$900.00',
        );
        expect(screen.getByTestId('proposed-expenses-cad')).toHaveTextContent(
            '$100.00',
        );
        expect(
            screen.getByTestId('proposed-reconciliation-status'),
        ).toHaveTextContent('Unbalanced');
        expect(
            screen.getByTestId('registered-balance-empty'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('balance-history-empty')).toBeInTheDocument();
        expect(
            screen.getByTestId('reconciliation-verify-link'),
        ).toHaveAttribute('href', '/reconciliation');
        expect(
            screen.queryByTestId('overwrite-balance-dialog'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId('balance-figures-differ-warning'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('proposed-balance-card')).not.toHaveAttribute(
            'data-differs',
        );
        expect(screen.getByTestId('register-period-balance')).toHaveTextContent(
            'Register balance',
        );
    });

    it('highlights figures that differ from the registered balance', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: {
                        period: '202501',
                        proposed: {
                            ...proposed,
                            assets_cad: 850,
                            equity_cad: 850,
                            reconciliation_status: 'balanced',
                        },
                        registered,
                        history: [],
                    },
                }),
            }),
        );

        render(<PeriodBalances />);

        await waitFor(() => {
            expect(
                screen.getByTestId('balance-figures-differ-warning'),
            ).toHaveTextContent(
                /assets, equity, and reconciliation status differ/i,
            );
        });
        expect(
            screen.getByTestId('balance-figures-differ-warning'),
        ).toHaveTextContent(/overwrite/i);

        expect(screen.getByTestId('proposed-balance-card')).toHaveAttribute(
            'data-differs',
            'true',
        );
        expect(screen.getByTestId('registered-balance-card')).toHaveAttribute(
            'data-differs',
            'true',
        );
        expect(screen.getByTestId('proposed-balance-card')).toHaveClass(
            'border-amber-400',
        );
        expect(screen.getByTestId('registered-balance-card')).toHaveClass(
            'border-amber-400',
        );

        const proposedAssets = screen.getByTestId('proposed-assets-cad');
        expect(proposedAssets).toHaveTextContent('$850.00');
        expect(figureRow(proposedAssets)).toHaveAttribute(
            'data-differs',
            'true',
        );
        expect(figureRow(proposedAssets)).toHaveClass('bg-amber-50');
        expect(
            screen.getByTestId('proposed-assets-cad-delta'),
        ).toHaveTextContent('-$50.00');
        expect(
            figureRow(screen.getByTestId('proposed-equity-cad')),
        ).toHaveClass('bg-amber-50');
        expect(
            screen.getByTestId('proposed-equity-cad-delta'),
        ).toHaveTextContent('-$50.00');
        expect(
            figureRow(screen.getByTestId('proposed-liabilities-cad')),
        ).not.toHaveAttribute('data-differs');
        expect(
            screen.queryByTestId('proposed-liabilities-cad-delta'),
        ).not.toBeInTheDocument();
        expect(
            figureRow(screen.getByTestId('proposed-expenses-cad')),
        ).not.toHaveAttribute('data-differs');

        expect(
            figureRow(screen.getByTestId('registered-assets-cad')),
        ).toHaveClass('bg-amber-50');
        expect(
            screen.queryByTestId('registered-assets-cad-delta'),
        ).not.toBeInTheDocument();
        expect(
            figureRow(screen.getByTestId('registered-liabilities-cad')),
        ).not.toHaveAttribute('data-differs');

        expect(
            screen.getByTestId('proposed-reconciliation-status'),
        ).toHaveAttribute('data-differs', 'true');
        expect(
            screen.getByTestId('registered-reconciliation-status'),
        ).toHaveAttribute('data-differs', 'true');
        expect(
            screen.getByTestId('proposed-reconciliation-status'),
        ).toHaveClass('bg-amber-50');
        expect(screen.getByTestId('register-period-balance')).toHaveTextContent(
            'Overwrite balance',
        );
    });

    it('leaves matching registered figures unhighlighted', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: {
                        period: '202501',
                        proposed,
                        registered,
                        history: [],
                    },
                }),
            }),
        );

        render(<PeriodBalances />);

        await waitFor(() => {
            expect(
                screen.getByTestId('registered-assets-cad'),
            ).toHaveTextContent('$900.00');
        });

        expect(
            screen.queryByTestId('balance-figures-differ-warning'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('proposed-balance-card')).not.toHaveAttribute(
            'data-differs',
        );
        expect(
            screen.getByTestId('registered-balance-card'),
        ).not.toHaveAttribute('data-differs');
        expect(
            figureRow(screen.getByTestId('proposed-assets-cad')),
        ).not.toHaveAttribute('data-differs');
        expect(
            figureRow(screen.getByTestId('registered-assets-cad')),
        ).not.toHaveAttribute('data-differs');
        expect(
            screen.getByTestId('proposed-reconciliation-status'),
        ).not.toHaveAttribute('data-differs');
        expect(
            screen.getByTestId('registered-reconciliation-status'),
        ).not.toHaveAttribute('data-differs');
        expect(screen.getByTestId('register-period-balance')).toHaveTextContent(
            'Register balance',
        );
    });

    it('asks before overwriting an existing balance and keeps the previous figures in history', async () => {
        let registeredNow = true;

        const fetchMock = vi.fn(
            async (input: RequestInfo | URL, init?: RequestInit) => {
                const method = init?.method ?? 'GET';

                if (method === 'POST') {
                    if (typeof init?.body !== 'string') {
                        throw new Error('Expected a JSON request body');
                    }
                    const body = JSON.parse(init.body);
                    expect(body).toEqual({
                        period: '202501',
                        overwrite: true,
                    });
                    registeredNow = false;

                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            data: {
                                ...registered,
                                assets_cad: 850,
                                equity_cad: 850,
                            },
                            meta: { overwritten: true },
                        }),
                    };
                }

                if (registeredNow) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            data: {
                                period: '202501',
                                proposed: {
                                    ...proposed,
                                    assets_cad: 850,
                                    equity_cad: 850,
                                },
                                registered,
                                history: [],
                            },
                        }),
                    };
                }

                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        data: {
                            period: '202501',
                            proposed: {
                                ...proposed,
                                assets_cad: 850,
                                equity_cad: 850,
                            },
                            registered: {
                                ...registered,
                                assets_cad: 850,
                                equity_cad: 850,
                                updated_at: '2026-02-01T12:00:00.000000Z',
                            },
                            history: [
                                {
                                    ...proposed,
                                    id: 3,
                                    recorded_at: '2026-01-15T12:00:00.000000Z',
                                    replaced_at: '2026-02-01T12:00:00.000000Z',
                                },
                            ],
                        },
                    }),
                };
            },
        );

        vi.stubGlobal('fetch', fetchMock);

        render(<PeriodBalances />);

        await waitFor(() => {
            expect(
                screen.getByTestId('registered-assets-cad'),
            ).toHaveTextContent('$900.00');
        });

        fireEvent.click(screen.getByTestId('register-period-balance'));

        expect(
            screen.getByTestId('overwrite-balance-dialog'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('overwrite-balance-title')).toHaveTextContent(
            'Overwrite existing balance?',
        );
        expect(
            screen.getByTestId('overwrite-existing-assets-cad'),
        ).toHaveTextContent('$900.00');
        expect(
            screen.getByTestId('overwrite-proposed-assets-cad'),
        ).toHaveTextContent('$850.00');
        expect(screen.getByTestId('overwrite-balance-dialog')).toHaveClass(
            'sm:max-w-3xl',
        );
        expect(
            screen.getByTestId('overwrite-existing-assets-cad').closest('dl'),
        ).toHaveClass('grid-cols-1');
        expect(
            screen.getByTestId('overwrite-proposed-assets-cad').closest('dl'),
        ).toHaveClass('grid-cols-1');
        expect(screen.getByTestId('overwrite-balance-comparison')).toHaveClass(
            'sm:grid-cols-2',
        );
        expect(
            screen.getByTestId('overwrite-figures-differ-warning'),
        ).toHaveTextContent(/assets and equity differ/i);
        expect(
            figureRow(screen.getByTestId('overwrite-existing-assets-cad')),
        ).toHaveClass('bg-amber-50');
        expect(
            figureRow(screen.getByTestId('overwrite-proposed-assets-cad')),
        ).toHaveClass('bg-amber-50');
        expect(
            screen.getByTestId('overwrite-proposed-assets-cad-delta'),
        ).toHaveTextContent('-$50.00');
        expect(
            figureRow(screen.getByTestId('overwrite-proposed-liabilities-cad')),
        ).not.toHaveAttribute('data-differs');
        expect(
            screen.queryByTestId('overwrite-proposed-liabilities-cad-delta'),
        ).not.toBeInTheDocument();

        const postsBeforeConfirm = fetchMock.mock.calls.filter(
            (call) => (call[1] as RequestInit | undefined)?.method === 'POST',
        );
        expect(postsBeforeConfirm).toHaveLength(0);

        fireEvent.click(screen.getByTestId('overwrite-balance-confirm'));

        await waitFor(() => {
            expect(
                screen.getByTestId('period-balance-success'),
            ).toHaveTextContent(/overwritten/i);
        });

        expect(screen.getByTestId('registered-assets-cad')).toHaveTextContent(
            '$850.00',
        );
        expect(
            screen.queryByTestId('balance-figures-differ-warning'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('balance-history-row-3')).toBeInTheDocument();
        expect(
            screen.getByTestId('balance-history-assets-3'),
        ).toHaveTextContent('$900.00');
    });

    it('cancels overwrite without changing the registered balance', async () => {
        const fetchMock = vi.fn(
            async (_input: RequestInfo | URL, _init?: RequestInit) => ({
                ok: true,
                status: 200,
                json: async () => ({
                    data: {
                        period: '202501',
                        proposed: {
                            ...proposed,
                            assets_cad: 850,
                            equity_cad: 850,
                        },
                        registered,
                        history: [],
                    },
                }),
            }),
        );

        vi.stubGlobal('fetch', fetchMock);

        render(<PeriodBalances />);

        await waitFor(() => {
            expect(
                screen.getByTestId('registered-assets-cad'),
            ).toHaveTextContent('$900.00');
        });

        fireEvent.click(screen.getByTestId('register-period-balance'));
        expect(
            screen.getByTestId('overwrite-balance-dialog'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('overwrite-balance-cancel'));

        await waitFor(() => {
            expect(
                screen.queryByTestId('overwrite-balance-dialog'),
            ).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('registered-assets-cad')).toHaveTextContent(
            '$900.00',
        );
        const posts = fetchMock.mock.calls.filter(
            (call) => (call[1] as RequestInit | undefined)?.method === 'POST',
        );
        expect(posts).toHaveLength(0);
    });
});
