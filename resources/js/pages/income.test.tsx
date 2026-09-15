import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Income from '@/pages/income';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { User } from '@/types';
import AppLayout from '@/layouts/app-layout';

type MockPage = {
    url: string;
    props: {
        name: string;
        auth: {
            user: User;
        };
        sidebarOpen: boolean;
    };
};

const mockPage: MockPage = {
    url: '/income',
    props: {
        name: 'Pockety',
        auth: {
            user: {
                id: 1,
                name: 'Dario Rivera',
                email: 'dario@example.com',
                email_verified_at: '2026-09-13T00:00:00Z',
                created_at: '2026-09-13T00:00:00Z',
                updated_at: '2026-09-13T00:00:00Z',
            },
        },
        sidebarOpen: true,
    },
};

function resolveHref(href: unknown): string {
    if (typeof href === 'string') {
        return href;
    }

    if (
        typeof href === 'object' &&
        href !== null &&
        'url' in href &&
        typeof href.url === 'string'
    ) {
        return href.url;
    }

    return '#';
}

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title?: string }) => (
        <title>{title ?? 'Pockety'}</title>
    ),
    Link: ({
        href,
        children,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: unknown;
    }) => (
        <a href={resolveHref(href)} {...props}>
            {children}
        </a>
    ),
    usePage: () => mockPage,
}));

vi.mock('@/layouts/app-layout', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="app-layout">{children}</div>
    ),
}));

const fetchMock = vi.fn();

function renderIncome() {
    return render(
        <TooltipProvider>
            <AppLayout>
                <Income />
            </AppLayout>
        </TooltipProvider>,
    );
}

describe('Income page', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [],
                meta: {
                    period: '202501',
                    total: 0,
                    max_lines: 6,
                    total_cad_equivalent: 0,
                },
            }),
        });
    });

    it('renders the income page without crashing', async () => {
        renderIncome();
        expect(await screen.findByText('Income')).toBeDefined();
    });

    it('shows Add Income button', async () => {
        renderIncome();
        expect(
            await screen.findByRole('button', { name: /add income/i }),
        ).toBeDefined();
    });

    it('loads income for the selected period', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    {
                        id: 1,
                        period: '202501',
                        description: 'Salary - Main Job',
                        line_number: 1,
                        amount_cad: 5000,
                        amount_usd: 0,
                        amount_cop: 0,
                        notes: null,
                        total_cad_equivalent: 5000,
                    },
                ],
                meta: {
                    period: '202501',
                    total: 1,
                    max_lines: 6,
                    total_cad_equivalent: 5000,
                },
            }),
        });

        renderIncome();

        expect(await screen.findByText('Salary - Main Job')).toBeDefined();
        expect(screen.getByTestId('income-total-cad').textContent).toMatch(
            /5,000/,
        );
    });

    it('displays multi-currency amounts on a line', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    {
                        id: 2,
                        period: '202501',
                        description: 'Mixed Income',
                        line_number: 1,
                        amount_cad: 1000,
                        amount_usd: 500,
                        amount_cop: 0,
                        notes: null,
                        total_cad_equivalent: 1375,
                    },
                ],
                meta: {
                    period: '202501',
                    total: 1,
                    max_lines: 6,
                    total_cad_equivalent: 1375,
                },
            }),
        });

        renderIncome();

        expect(await screen.findByText('Mixed Income')).toBeDefined();
        expect(screen.getByText(/1,000/)).toBeDefined();
        expect(screen.getByText(/500/)).toBeDefined();
    });

    it('opens the add income dialog', async () => {
        renderIncome();

        fireEvent.click(
            await screen.findByRole('button', { name: /add income/i }),
        );

        expect(await screen.findByLabelText(/description/i)).toBeDefined();
        expect(screen.getByLabelText(/amount cad/i)).toBeDefined();
        expect(screen.getByLabelText(/amount usd/i)).toBeDefined();
        expect(screen.getByLabelText(/amount cop/i)).toBeDefined();
    });

    it('submits a new income line via the API', async () => {
        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method ?? 'GET';

            if (method === 'POST' && url.includes('/api/income')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: {
                            id: 10,
                            period: '202501',
                            description: 'Salary - Main Job',
                            line_number: 1,
                            amount_cad: 5000,
                            amount_usd: 0,
                            amount_cop: 0,
                            notes: null,
                            total_cad_equivalent: 5000,
                        },
                    }),
                };
            }

            return {
                ok: true,
                json: async () => ({
                    data: [],
                    meta: {
                        period: '202501',
                        total: 0,
                        max_lines: 6,
                        total_cad_equivalent: 0,
                    },
                }),
            };
        });

        renderIncome();

        const periodInput = await screen.findByLabelText(/period/i);
        fireEvent.change(periodInput, { target: { value: '202501' } });
        fireEvent.click(screen.getByRole('button', { name: /load period/i }));

        fireEvent.click(
            await screen.findByRole('button', { name: /add income/i }),
        );

        fireEvent.change(await screen.findByLabelText(/description/i), {
            target: { value: 'Salary - Main Job' },
        });
        fireEvent.change(screen.getByLabelText(/amount cad/i), {
            target: { value: '5000' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save income/i }));

        await waitFor(() => {
            const postCall = fetchMock.mock.calls.find(
                (call) =>
                    call[1]?.method === 'POST' &&
                    String(call[0]).includes('/api/income'),
            );
            expect(postCall).toBeDefined();
            expect(JSON.parse(postCall![1].body as string)).toMatchObject({
                period: '202501',
                description: 'Salary - Main Job',
                amount_cad: 5000,
            });
        });
    });
});
