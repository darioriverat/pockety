import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toaster } from './sonner';

vi.mock('@/hooks/use-appearance', () => ({
    useAppearance: () => ({
        appearance: 'light',
        resolvedAppearance: 'light',
        updateAppearance: vi.fn(),
    }),
}));

vi.mock('@/hooks/use-flash-toast', () => ({
    useFlashToast: vi.fn(),
}));

vi.mock('sonner', () => ({
    Toaster: ({
        richColors,
        closeButton,
        duration,
        icons,
        className,
        toastOptions,
    }: {
        richColors?: boolean;
        closeButton?: boolean;
        duration?: number;
        icons?: { success?: React.ReactNode };
        className?: string;
        toastOptions?: { classNames?: { success?: string; closeButton?: string } };
    }) => (
        <div
            data-testid="sonner-toaster"
            data-rich-colors={richColors ? 'true' : 'false'}
            data-close-button={closeButton ? 'true' : 'false'}
            data-duration={duration}
            className={className}
            data-success-class={toastOptions?.classNames?.success}
            data-close-class={toastOptions?.classNames?.closeButton}
        >
            {icons?.success}
        </div>
    ),
}));

describe('Toaster success messaging', () => {
    it('enables rich green colors, close button, and success icon', () => {
        render(<Toaster />);

        const toaster = screen.getByTestId('sonner-toaster');
        expect(toaster).toHaveAttribute('data-rich-colors', 'true');
        expect(toaster).toHaveAttribute('data-close-button', 'true');
        expect(toaster).toHaveAttribute('data-duration', '5000');
        expect(toaster).toHaveAttribute('data-success-class', 'success-toast');
        expect(toaster).toHaveAttribute('data-close-class', 'toast-close-button');
        expect(screen.getByTestId('success-toast-icon')).toBeInTheDocument();
    });
});
