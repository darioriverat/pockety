import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './table';

describe('Table', () => {
    it('renders a header with background styling and striped hoverable rows', () => {
        const { container } = render(
            <Table data-testid="sample-table">
                <TableHeader data-testid="sample-table-header">
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow data-testid="row-0">
                        <TableCell>2026-01-01</TableCell>
                        <TableCell>10.00</TableCell>
                    </TableRow>
                    <TableRow data-testid="row-1">
                        <TableCell>2026-01-02</TableCell>
                        <TableCell>20.00</TableCell>
                    </TableRow>
                </TableBody>
            </Table>,
        );

        const scroll = container.querySelector('[data-slot="table-scroll"]');
        expect(scroll).not.toBeNull();
        expect(scroll?.getAttribute('data-responsive')).toBe('scroll');
        expect(scroll?.className).toMatch(/overflow-x-auto/);

        const table = container.querySelector('table');
        expect(table?.className).toMatch(/min-w-\[36rem\]/);

        const header = screen.getByTestId('sample-table-header');
        expect(header.className).toMatch(/bg-muted/);
        expect(header.className).toMatch(/border-b/);

        const body = container.querySelector('tbody');
        expect(body?.className).toMatch(/nth-child\(even\)/);

        const firstRow = screen.getByTestId('row-0');
        expect(firstRow.className).toMatch(/hover:bg-accent/);
        expect(screen.getByText('Date').tagName).toBe('TH');
        expect(screen.getByText('Date').className).toMatch(/font-semibold/);
    });
});
