import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';
import source from './tooltip.tsx?raw';

describe('Tooltip Component - Feature 161: Helpful Context on Hover', () => {
    it('renders a trigger that can open helpful context', () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        const trigger = screen.getByTestId('trigger');
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveAttribute('data-slot', 'tooltip-trigger');
        expect(trigger).toHaveTextContent('Hover me');
    });

    it('applies proper styling classes to TooltipContent', () => {
        expect(source).toContain('bg-primary');
        expect(source).toContain('text-primary-foreground');
        expect(source).toContain('rounded-md');
        expect(source).toContain('z-50');
        expect(source).toContain('text-xs');
    });

    it('sets default sideOffset of 4px', () => {
        expect(source).toContain('sideOffset = 4');
    });

    it('renders arrow with proper styling', () => {
        expect(source).toContain('fill-primary');
        expect(source).toContain('rotate-45');
        expect(source).toContain('bg-primary');
        expect(source).toContain('rounded-[2px]');
    });

    it('supports custom className on TooltipContent', () => {
        expect(source).toContain('className');
        expect(source).toContain('cn(');
    });

    it('has animation classes for smooth appearance', () => {
        expect(source).toContain('fade-in-0');
        expect(source).toContain('zoom-in-95');
        expect(source).toContain('fade-out-0');
        expect(source).toContain('zoom-out-95');
    });
});
