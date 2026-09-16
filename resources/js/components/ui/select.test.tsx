import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select';

describe('Select Component - Feature 159: Arrow Indicator and Dropdown Styling', () => {
    it('renders SelectTrigger with ChevronDown icon', () => {
        render(
            <Select>
                <SelectTrigger data-testid="select-trigger">
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                </SelectContent>
            </Select>,
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveAttribute('data-slot', 'select-trigger');

        const chevronIcon = trigger.querySelector('svg.lucide-chevron-down');
        expect(chevronIcon).toBeInTheDocument();
    });

    it('applies proper styling classes to SelectTrigger', () => {
        render(
            <Select>
                <SelectTrigger data-testid="select-trigger">
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                </SelectContent>
            </Select>,
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger.className).toContain('border');
        expect(trigger.className).toContain('rounded-md');
        expect(trigger.className).toContain('shadow-xs');
        expect(trigger.className).toContain('focus-visible:ring');
    });

    it('renders SelectContent with proper styling attributes', () => {
        render(
            <Select open>
                <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                </SelectContent>
            </Select>,
        );

        const content = document.querySelector('[data-slot="select-content"]');
        expect(content).toBeInTheDocument();
        expect(content?.className).toContain('border');
        expect(content?.className).toContain('shadow-md');
        expect(content?.className).toContain('rounded-md');
    });

    it('renders SelectItem with check icon indicator', () => {
        render(
            <Select open value="1">
                <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                </SelectContent>
            </Select>,
        );

        const item = document.querySelector('[data-slot="select-item"]');
        expect(item).toBeInTheDocument();
        expect(item?.className).toContain('cursor-default');
        expect(item?.className).toContain('focus:bg-accent');

        const indicator = item?.querySelector(
            '[data-slot="select-item-indicator"]',
        );
        expect(indicator).toBeInTheDocument();
        expect(item?.querySelector('svg.lucide-check')).toBeInTheDocument();
    });

    it('supports small size variant', () => {
        render(
            <Select>
                <SelectTrigger size="sm" data-testid="select-trigger">
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                </SelectContent>
            </Select>,
        );

        expect(screen.getByTestId('select-trigger')).toHaveAttribute(
            'data-size',
            'sm',
        );
    });

    it('supports default size variant', () => {
        render(
            <Select>
                <SelectTrigger size="default" data-testid="select-trigger">
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                </SelectContent>
            </Select>,
        );

        expect(screen.getByTestId('select-trigger')).toHaveAttribute(
            'data-size',
            'default',
        );
    });

    it('renders scroll buttons with chevron icons', () => {
        render(
            <Select open>
                <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                            Option {i}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>,
        );

        const scrollUpButton = document.querySelector(
            '[data-slot="select-scroll-up-button"]',
        );
        const scrollDownButton = document.querySelector(
            '[data-slot="select-scroll-down-button"]',
        );

        expect(scrollUpButton || scrollDownButton).toBeTruthy();

        if (scrollUpButton) {
            expect(
                scrollUpButton.querySelector('svg.lucide-chevron-up'),
            ).toBeInTheDocument();
        }
        if (scrollDownButton) {
            expect(
                scrollDownButton.querySelector('svg.lucide-chevron-down'),
            ).toBeInTheDocument();
        }
    });
});
