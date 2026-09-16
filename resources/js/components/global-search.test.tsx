import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalSearch } from './global-search';

const visitMock = vi.fn();

vi.mock('@inertiajs/react', () => ({
    router: {
        visit: (...args: unknown[]) => visitMock(...args),
    },
}));

describe('GlobalSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('opens search dialog from header trigger', () => {
        render(<GlobalSearch />);

        fireEvent.click(screen.getByTestId('global-search-trigger'));

        expect(screen.getByTestId('global-search-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('global-search-input')).toBeInTheDocument();
    });

    it('shows results organized by accounts, transactions, and categories', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    query: 'RBC',
                    accounts: [
                        {
                            type: 'account',
                            id: 1,
                            title: 'RBC Chequing',
                            subtitle: 'Bank · CAD',
                            url: '/accounts/1',
                        },
                    ],
                    transactions: [
                        {
                            type: 'transaction',
                            id: 10,
                            title: 'Transfer from RBC online',
                            subtitle: '2025-01-15 · C001 · 42.50 CAD',
                            url: '/transactions?search=RBC',
                        },
                    ],
                    categories: [
                        {
                            type: 'category',
                            id: 'C050',
                            title: 'C050 — RBC Fees',
                            subtitle: 'COMISIONES RBC',
                            url: '/categories/C050',
                        },
                    ],
                    total: 3,
                },
            }),
        });

        render(<GlobalSearch />);
        fireEvent.click(screen.getByTestId('global-search-trigger'));
        fireEvent.change(screen.getByTestId('global-search-input'), {
            target: { value: 'RBC' },
        });

        await waitFor(() => {
            expect(screen.getByTestId('global-search-accounts')).toBeInTheDocument();
        });

        expect(screen.getByTestId('global-search-transactions')).toBeInTheDocument();
        expect(screen.getByTestId('global-search-categories')).toBeInTheDocument();
        expect(screen.getByText('RBC Chequing')).toBeInTheDocument();
        expect(screen.getByText('Transfer from RBC online')).toBeInTheDocument();
        expect(screen.getByText('C050 — RBC Fees')).toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/search?q=RBC&limit=8',
            expect.any(Object),
        );
    });

    it('navigates when a result is selected', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    query: 'RBC',
                    accounts: [
                        {
                            type: 'account',
                            id: 1,
                            title: 'RBC Chequing',
                            subtitle: 'Bank · CAD',
                            url: '/accounts/1',
                        },
                    ],
                    transactions: [],
                    categories: [],
                    total: 1,
                },
            }),
        });

        render(<GlobalSearch />);
        fireEvent.click(screen.getByTestId('global-search-trigger'));
        fireEvent.change(screen.getByTestId('global-search-input'), {
            target: { value: 'RBC' },
        });

        await waitFor(() => {
            expect(
                screen.getByTestId('global-search-hit-account-1'),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('global-search-hit-account-1'));

        expect(visitMock).toHaveBeenCalledWith('/accounts/1');
    });
});
