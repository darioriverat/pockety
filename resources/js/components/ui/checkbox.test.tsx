import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox Component - Feature 160: Custom Styling', () => {
    it('renders with custom styling classes', () => {
        render(<Checkbox data-testid="test-checkbox" />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        expect(checkbox).toBeInTheDocument();
        
        // Verify it has data-slot attribute (Radix UI pattern)
        expect(checkbox).toHaveAttribute('data-slot', 'checkbox');
        
        // Verify custom styling classes are present
        expect(checkbox.className).toContain('border');
        expect(checkbox.className).toContain('rounded');
        expect(checkbox.className).toContain('shadow');
    });
    
    it('renders as a button, not input type=checkbox', () => {
        render(<Checkbox data-testid="test-checkbox" />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Radix UI Checkbox uses a button element, not input type=checkbox
        expect(checkbox.tagName).toBe('BUTTON');
        expect(checkbox).toHaveAttribute('role', 'checkbox');
    });
    
    it('has proper ARIA attributes', () => {
        render(<Checkbox data-testid="test-checkbox" aria-label="Test checkbox" />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Should have checkbox role
        expect(checkbox).toHaveAttribute('role', 'checkbox');
        
        // Should have aria-checked attribute (Radix UI sets this)
        expect(checkbox).toHaveAttribute('aria-checked');
    });
    
    it('applies focus-visible styles', () => {
        render(<Checkbox data-testid="test-checkbox" />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Verify focus-visible and focus ring classes are present
        expect(checkbox.className).toContain('focus-visible:border-ring');
        expect(checkbox.className).toContain('focus-visible:ring');
    });
    
    it('has checked state styling', () => {
        render(<Checkbox data-testid="test-checkbox" checked />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Verify checked state styling classes
        expect(checkbox.className).toContain('data-[state=checked]:bg-primary');
        expect(checkbox.className).toContain('data-[state=checked]:text-primary-foreground');
    });
    
    it('renders check icon indicator', () => {
        const { container } = render(<Checkbox checked data-testid="test-checkbox" />);
        
        // Find the indicator element
        const indicator = container.querySelector('[data-slot="checkbox-indicator"]');
        expect(indicator).toBeInTheDocument();
        
        // Verify it contains a check icon (lucide-check)
        const checkIcon = container.querySelector('svg.lucide-check');
        expect(checkIcon).toBeInTheDocument();
    });
    
    it('has disabled state styling', () => {
        render(<Checkbox data-testid="test-checkbox" disabled />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Verify disabled styling classes
        expect(checkbox.className).toContain('disabled:cursor-not-allowed');
        expect(checkbox.className).toContain('disabled:opacity-50');
    });
    
    it('has proper size (4x4)', () => {
        render(<Checkbox data-testid="test-checkbox" />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Verify size class (size-4 = 1rem / 16px)
        expect(checkbox.className).toContain('size-4');
    });
    
    it('supports custom className prop', () => {
        render(<Checkbox data-testid="test-checkbox" className="custom-class" />);
        
        const checkbox = screen.getByTestId('test-checkbox');
        
        // Custom class should be merged
        expect(checkbox.className).toContain('custom-class');
        // But default classes should still be there
        expect(checkbox.className).toContain('border');
    });
});
