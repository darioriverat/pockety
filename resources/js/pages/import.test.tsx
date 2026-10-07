import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImportPage from './import';

vi.mock('@inertiajs/react', () => ({
    Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

describe('Import page uploads', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        global.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = input instanceof Request ? input.url : String(input);
            if (url.includes('/statistics')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: {
                            total: 0,
                            by_period: {},
                            by_currency: { cad: 0, usd: 0, cop: 0 },
                            by_type: {},
                            periods_covered: { min: null, max: null },
                            snapshots: [],
                        },
                    }),
                } as Response;
            }

            throw new Error(`Unexpected fetch: ${url}`);
        }) as typeof fetch;
    });

    it('renders empty file inputs and no personal filenames', async () => {
        const { container } = render(<ImportPage />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        expect(screen.getByTestId('transaction-file-input')).toHaveValue('');
        expect(screen.getByTestId('account-file-input')).toHaveValue('');
        expect(screen.getByTestId('balance-sheet-file-input')).toHaveValue('');
        expect(container.textContent).not.toContain(
            'gastos_ledger_2025_2026.json',
        );
        expect(container.textContent).not.toContain(
            'estado_financiero_2025_2026.json',
        );
        expect(container.textContent).not.toMatch(/\bmonth_sheets\b/);
    });

    it('rejects empty submits without calling import endpoints', async () => {
        render(<ImportPage />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockClear();

        fireEvent.click(screen.getByTestId('import-transactions-button'));
        expect(
            await screen.findByTestId('transaction-import-error'),
        ).toHaveTextContent('Please choose a .json or .csv file');

        fireEvent.click(screen.getByTestId('import-accounts-button'));
        expect(
            await screen.findByTestId('account-import-error'),
        ).toHaveTextContent(
            'Please choose one or more .json month-sheet files',
        );

        fireEvent.click(screen.getByTestId('import-balance-sheet-button'));
        expect(
            await screen.findByTestId('balance-sheet-import-error'),
        ).toHaveTextContent('Please choose a .json balance sheet file');

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('posts multipart FormData for a chosen transaction file', async () => {
        const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockImplementation(
            async (input: RequestInfo | URL, init?: RequestInit) => {
                const url =
                    input instanceof Request ? input.url : String(input);
                if (url.includes('/statistics')) {
                    return {
                        ok: true,
                        json: async () => ({
                            data: {
                                total: 0,
                                by_period: {},
                                by_currency: { cad: 0, usd: 0, cop: 0 },
                                by_type: {},
                                periods_covered: { min: null, max: null },
                                snapshots: [],
                            },
                        }),
                    } as Response;
                }

                if (
                    url.includes('/api/transactions/import') &&
                    init?.method === 'POST'
                ) {
                    expect(init.body).toBeInstanceOf(FormData);
                    const body = init.body as FormData;
                    expect(body.get('file')).toBeInstanceOf(File);
                    expect(body.has('file_path')).toBe(false);
                    expect(body.has('directory')).toBe(false);

                    return {
                        ok: true,
                        json: async () => ({
                            data: { imported: 1, skipped: 0, errors: [] },
                        }),
                    } as Response;
                }

                throw new Error(`Unexpected fetch: ${url}`);
            },
        );

        render(<ImportPage />);
        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        const file = new File(
            [JSON.stringify([{ date: '2025-01-01', period: '202501' }])],
            'sample.json',
            { type: 'application/json' },
        );

        fireEvent.change(screen.getByTestId('transaction-file-input'), {
            target: { files: [file] },
        });
        fireEvent.click(screen.getByTestId('import-transactions-button'));

        await waitFor(() => {
            expect(
                screen.getByTestId('transactions-imported'),
            ).toHaveTextContent('Imported: 1');
        });
    });
});
