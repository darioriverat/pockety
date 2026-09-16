import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './dialog';

describe('Dialog modal presentation', () => {
    it('renders a dark backdrop behind centered content', () => {
        render(
            <Dialog open>
                <DialogContent data-testid="sample-dialog">
                    <DialogHeader>
                        <DialogTitle>Sample modal</DialogTitle>
                        <DialogDescription>
                            Used to verify overlay and centering classes.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>,
        );

        const overlay = screen.getByTestId('dialog-overlay');
        const content = screen.getByTestId('sample-dialog');

        expect(overlay.className).toMatch(/fixed/);
        expect(overlay.className).toMatch(/inset-0/);
        expect(overlay.className).toMatch(/z-50/);
        expect(overlay.className).toMatch(/bg-black\/80/);

        expect(content).toHaveAttribute('data-modal-centered', 'true');
        expect(content.className).toMatch(/fixed/);
        expect(content.className).toMatch(/top-1\/2/);
        expect(content.className).toMatch(/left-1\/2/);
        expect(content.className).toMatch(/-translate-x-1\/2/);
        expect(content.className).toMatch(/-translate-y-1\/2/);
        expect(content.className).toMatch(/z-\[51\]/);
    });

    it('closes when the backdrop is clicked', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        render(
            <Dialog open onOpenChange={onOpenChange}>
                <DialogContent data-testid="sample-dialog">
                    <DialogHeader>
                        <DialogTitle>Closeable modal</DialogTitle>
                        <DialogDescription>
                            Backdrop click should dismiss this dialog.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>,
        );

        await user.click(screen.getByTestId('dialog-overlay'));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
