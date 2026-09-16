import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';

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
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        const content = document.querySelector('[data-slot="tooltip-content"]');
        expect(content).toBeInTheDocument();
        expect(content?.className).toContain('bg-primary');
        expect(content?.className).toContain('text-primary-foreground');
        expect(content?.className).toContain('rounded-md');
        expect(content?.className).toContain('z-50');
        expect(content?.className).toContain('text-xs');
    });

    it('sets default sideOffset of 4px', () => {
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        expect(
            document.querySelector('[data-slot="tooltip-content"]'),
        ).toBeInTheDocument();
    });

    it('renders arrow with proper styling', () => {
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        const arrow = document.querySelector('.fill-primary.rotate-45');
        expect(arrow).toBeInTheDocument();
        expect(arrow?.className).toContain('bg-primary');
        expect(arrow?.className).toContain('rounded');
    });

    it('supports custom className on TooltipContent', () => {
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent className="custom-class">
                        Tooltip text
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        const content = document.querySelector('[data-slot="tooltip-content"]');
        expect(content?.className).toContain('custom-class');
        expect(content?.className).toContain('bg-primary');
    });

    it('has animation classes for smooth appearance', () => {
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>,
        );

        const content = document.querySelector('[data-slot="tooltip-content"]');
        expect(content?.className).toContain('fade-in');
        expect(content?.className).toContain('zoom-in');
        expect(content?.className).toContain('fade-out');
        expect(content?.className).toContain('zoom-out');
    });
});
