import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
    it('keeps a disabled secondary action inert', () => {
        const onClick = vi.fn();
        render(<Button variant="secondary" disabled onClick={onClick}>Bulk Edit</Button>);
        const button = screen.getByRole('button', { name: 'Bulk Edit' });
        fireEvent.click(button);
        expect(button).toBeDisabled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('preserves link semantics when an outlined action uses asChild', () => {
        render(<Button variant="outline" asChild><a href="/transactions">Back to transactions</a></Button>);
        expect(screen.getByRole('link', { name: 'Back to transactions' })).toHaveAttribute('href', '/transactions');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
