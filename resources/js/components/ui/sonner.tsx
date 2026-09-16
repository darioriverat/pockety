import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { CheckCircle2 } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance, resolvedAppearance } = useAppearance();

    useFlashToast();

    const isDark = resolvedAppearance === 'dark';

    return (
        <Sonner
            theme={appearance === 'system' ? resolvedAppearance : appearance}
            className="toaster group"
            position="bottom-right"
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    // Brighter green text in dark mode for WCAG AA contrast
                    '--success-bg': isDark
                        ? 'hsl(150, 40%, 12%)'
                        : 'hsl(143, 70%, 94%)',
                    '--success-border': isDark
                        ? 'hsl(147, 50%, 28%)'
                        : 'hsl(145, 60%, 70%)',
                    '--success-text': isDark
                        ? 'hsl(142, 70%, 72%)'
                        : 'hsl(142, 90%, 20%)',
                } as React.CSSProperties
            }
            {...props}
            richColors
            closeButton
            duration={5000}
            icons={{
                success: (
                    <CheckCircle2
                        className="size-4 shrink-0"
                        aria-hidden="true"
                        data-testid="success-toast-icon"
                    />
                ),
                ...props.icons,
            }}
            toastOptions={{
                ...props.toastOptions,
                classNames: {
                    ...props.toastOptions?.classNames,
                    success: 'success-toast',
                    closeButton: 'toast-close-button',
                },
            }}
        />
    );
}

export { Toaster };
