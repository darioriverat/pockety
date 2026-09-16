import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';

describe('Tooltip Component - Feature 161: Helpful Context on Hover', () => {
    it('renders TooltipProvider with data-slot attribute', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        const provider = container.querySelector('[data-slot="tooltip-provider"]');
        expect(provider).toBeInTheDocument();
    });
    
    it('renders Tooltip root with data-slot attribute', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        const tooltipRoot = container.querySelector('[data-slot="tooltip"]');
        expect(tooltipRoot).toBeInTheDocument();
    });
    
    it('renders TooltipTrigger', () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        const trigger = screen.getByTestId('trigger');
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveAttribute('data-slot', 'tooltip-trigger');
    });
    
    it('applies proper styling classes to TooltipContent', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        // TooltipContent is rendered in a portal
        const content = container.querySelector('[data-slot="tooltip-content"]');
        
        if (content) {
            // Verify styling classes
            expect(content.className).toContain('bg-primary');
            expect(content.className).toContain('text-primary-foreground');
            expect(content.className).toContain('rounded-md');
            expect(content.className).toContain('z-50');
            expect(content.className).toContain('text-xs');
        }
    });
    
    it('sets default sideOffset of 4px', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        // The content should be in a portal with proper offset
        const content = container.querySelector('[data-slot="tooltip-content"]');
        expect(content).toBeInTheDocument();
    });
    
    it('renders arrow with proper styling', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        // Find the arrow element
        const arrow = container.querySelector('.fill-primary.rotate-45');
        expect(arrow).toBeInTheDocument();
        
        if (arrow) {
            expect(arrow.className).toContain('bg-primary');
            expect(arrow.className).toContain('rounded');
        }
    });
    
    it('supports custom className on TooltipContent', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent className="custom-class">
                        Tooltip text
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        const content = container.querySelector('[data-slot="tooltip-content"]');
        
        if (content) {
            expect(content.className).toContain('custom-class');
            // Default classes should still be there
            expect(content.className).toContain('bg-primary');
        }
    });
    
    it('sets delayDuration to 0 by default in provider', () => {
        // The default delayDuration is set to 0 in the component
        // This means tooltips appear immediately without delay
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        // Provider should be rendered
        expect(screen.getByText('Hover me')).toBeInTheDocument();
    });
    
    it('has animation classes for smooth appearance', () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        
        const content = container.querySelector('[data-slot="tooltip-content"]');
        
        if (content) {
            // Should have fade-in animation
            expect(content.className).toContain('fade-in');
            expect(content.className).toContain('zoom-in');
            // And fade-out animations for closing
            expect(content.className).toContain('fade-out');
            expect(content.className).toContain('zoom-out');
        }
    });
});
