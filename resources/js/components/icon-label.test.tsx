import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wallet } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { IconLabel } from '@/components/icon-label';

describe('Icon', () => {
    it('renders lucide with outline size tokens', () => {
        const { container } = render(
            <Icon iconNode={Wallet} size="md" data-testid="wallet-icon" />,
        );

        const svg = screen.getByTestId('wallet-icon');
        expect(svg).toHaveAttribute('data-slot', 'icon');
        expect(svg.getAttribute('class')).toContain('size-4');
        expect(svg.getAttribute('class')).toContain('fill-none');
        expect(svg.getAttribute('class')).toContain('shrink-0');
        expect(container.querySelector('svg')).not.toBeNull();
    });

    it('returns null when iconNode is missing', () => {
        const { container } = render(<Icon iconNode={null} />);
        expect(container.firstChild).toBeNull();
    });
});

describe('IconLabel', () => {
    it('vertically aligns icon with text', () => {
        render(
            <IconLabel icon={Wallet} size="md">
                Manage Balances
            </IconLabel>,
        );

        const label = screen.getByTestId('icon-label');
        expect(label).toHaveAttribute('data-slot', 'icon-label');
        expect(label.className).toContain('inline-flex');
        expect(label.className).toContain('items-center');
        expect(label.className).toContain('gap-2');
        expect(label.textContent).toContain('Manage Balances');
        expect(label.querySelector('[data-slot="icon"]')).not.toBeNull();
    });
});
