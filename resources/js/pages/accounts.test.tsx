import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import Accounts from './accounts';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: (props: ComponentProps<'a'>) => <a {...props} />,
}));

afterEach(() => vi.unstubAllGlobals());

it('keeps all account actions available and opens the matching account dialogs', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL) => {
            const url = input instanceof Request ? input.url : String(input);
            return new Response(
                JSON.stringify({
                    data:
                        url === '/api/accounts'
                            ? [
                                  {
                                      id: 42,
                                      name: 'Layout Bank',
                                      type: 'bank',
                                      primary_currency: 'CAD',
                                      notes: null,
                                      is_active: true,
                                      is_asset: true,
                                      is_liability: false,
                                  },
                              ]
                            : [],
                }),
                { status: 200 },
            );
        }),
    );
    render(<Accounts />);
    const edit = await screen.findByRole('button', {
        name: 'Edit',
    });
    expect(
        screen.getByRole('link', { name: 'View Transactions' }),
    ).toHaveAttribute('href', '/accounts/42');
    fireEvent.click(edit);
    expect(await screen.findByLabelText('Account Name')).toHaveValue(
        'Layout Bank',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage Balances' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Layout Bank');
    expect(fetch).toHaveBeenCalledWith('/api/accounts/42/balances');
});
