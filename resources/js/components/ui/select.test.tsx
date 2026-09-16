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
            </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toBeInTheDocument();

        // Verify the trigger has the correct data attributes
        expect(trigger).toHaveAttribute('data-slot', 'select-trigger');

        // Verify ChevronDown icon is present (lucide-react adds the lucide-chevron-down class)
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
            </Select>
        );

        const trigger = screen.getByTestId('select-trigger');

        // Verify key styling classes are present
        expect(trigger.className).toContain('border');
        expect(trigger.className).toContain('rounded-md');
        expect(trigger.className).toContain('shadow-xs');
        expect(trigger.className).toContain('focus-visible:ring');
    });

    it('renders SelectContent with proper styling attributes', () => {
        const { container } = render(
            <Select open>
                <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent data-testid="select-content">
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                </SelectContent>
            </Select>
        );

        // SelectContent is rendered in a portal, so we need to check for data-slot
        const content = container.querySelector('[data-slot="select-content"]');
        expect(content).toBeInTheDocument();

        if (content) {
            // Verify styling classes for dropdown
            expect(content.className).toContain('border');
            expect(content.className).toContain('shadow-md');
            expect(content.className).toContain('rounded-md');
        }
    });

    it('renders SelectItem with check icon indicator', () => {
        const { container } = render(
            <Select open value="1">
                <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1" data-testid="select-item-1">
                        Option 1
                    </SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                </SelectContent>
            </Select>
        );

        // Find the item with data-slot
        const item = container.querySelector('[data-slot="select-item"]');
        expect(item).toBeInTheDocument();

        if (item) {
            // Verify item has proper styling
            expect(item.className).toContain('cursor-default');
            expect(item.className).toContain('focus:bg-accent');

            // Verify check icon indicator exists
            const indicator = item.querySelector('[data-slot="select-item-indicator"]');
            expect(indicator).toBeInTheDocument();

            // Verify the indicator contains a check icon (lucide-check class)
            const checkIcon = item.querySelector('svg.lucide-check');
            expect(checkIcon).toBeInTheDocument();
        }
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
            </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toHaveAttribute('data-size', 'sm');
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
            </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toHaveAttribute('data-size', 'default');
    });

    it('renders scroll buttons with chevron icons', () => {
        const { container } = render(
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
            </Select>
        );

        // Scroll buttons are rendered by default in SelectContent
        const scrollUpButton = container.querySelector('[data-slot="select-scroll-up-button"]');
        const scrollDownButton = container.querySelector('[data-slot="select-scroll-down-button"]');

        // At least one should be present
        expect(scrollUpButton || scrollDownButton).toBeTruthy();

        // Both should contain ChevronUp/ChevronDown icons
        if (scrollUpButton) {
            const upIcon = scrollUpButton.querySelector('svg.lucide-chevron-up');
            expect(upIcon).toBeInTheDocument();
        }
        if (scrollDownButton) {
            const downIcon = scrollDownButton.querySelector('svg.lucide-chevron-down');
            expect(downIcon).toBeInTheDocument();
        }
    });
});
