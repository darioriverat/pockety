import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
] as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function formatDate(year: number, monthIndex: number, day: number): string {
    return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseDate(value: string): { year: number; month: number; day: number } | null {
    if (!DATE_PATTERN.test(value)) {
        return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }
    return { year, month: month - 1, day };
}

function daysInMonth(year: number, monthIndex: number): number {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function startWeekday(year: number, monthIndex: number): number {
    return new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
}

export interface DatePickerProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    'aria-invalid'?: boolean | 'true' | 'false';
    'aria-describedby'?: string;
    'data-testid'?: string;
    className?: string;
    name?: string;
}

function DatePicker({
    id,
    value,
    onChange,
    placeholder = 'YYYY-MM-DD',
    disabled = false,
    required = false,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'data-testid': testId = 'date-picker',
    className,
    name,
}: DatePickerProps) {
    const rootRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);

    const parsed = parseDate(value);
    const today = React.useMemo(() => {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
        };
    }, []);

    const [viewYear, setViewYear] = React.useState(
        parsed?.year ?? today.year,
    );
    const [viewMonth, setViewMonth] = React.useState(
        parsed?.month ?? today.month,
    );

    React.useEffect(() => {
        if (!open) {
            return;
        }
        if (parsed) {
            setViewYear(parsed.year);
            setViewMonth(parsed.month);
        }
    }, [open, parsed?.year, parsed?.month]);

    React.useEffect(() => {
        if (!open) {
            return;
        }
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (rootRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                setOpen(false);
                inputRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, [open]);

    const openCalendar = () => {
        if (disabled) {
            return;
        }
        setOpen(true);
    };

    const selectDay = (day: number) => {
        const next = formatDate(viewYear, viewMonth, day);
        onChange(next);
        setOpen(false);
        inputRef.current?.focus();
    };

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
            return;
        }
        setViewMonth((m) => m - 1);
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
            return;
        }
        setViewMonth((m) => m + 1);
    };

    const blankDays = startWeekday(viewYear, viewMonth);
    const totalDays = daysInMonth(viewYear, viewMonth);
    const todayKey = formatDate(today.year, today.month, today.day);
    const selectedKey = parsed
        ? formatDate(parsed.year, parsed.month, parsed.day)
        : null;

    return (
        <div
            ref={rootRef}
            className={cn('relative', className)}
            data-testid={testId}
            data-date-format="YYYY-MM-DD"
        >
            <div className="relative">
                <Input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={value}
                    disabled={disabled}
                    required={required}
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedBy}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    data-testid={`${testId}-input`}
                    className="pr-10"
                    onChange={(event) => onChange(event.target.value)}
                    onClick={openCalendar}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    tabIndex={-1}
                    disabled={disabled}
                    className="text-muted-foreground absolute top-1/2 right-0.5 size-8 -translate-y-1/2"
                    aria-label="Open calendar"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    data-testid={`${testId}-trigger`}
                    onClick={() => {
                        if (open) {
                            setOpen(false);
                            return;
                        }
                        openCalendar();
                    }}
                >
                    <CalendarIcon className="size-4" />
                </Button>
            </div>
            {open ? (
                <div
                    role="dialog"
                    aria-label="Choose date"
                    data-testid="date-picker-calendar"
                    data-date-format="YYYY-MM-DD"
                    className="bg-popover text-popover-foreground border-border mt-2 rounded-md border p-3 shadow-md"
                >
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8"
                            tabIndex={-1}
                            onClick={goPrevMonth}
                            aria-label="Previous month"
                            data-testid="date-picker-prev-month"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <p
                            className="text-sm font-medium"
                            data-testid="date-picker-month-label"
                        >
                            {MONTHS[viewMonth]} {viewYear}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8"
                            tabIndex={-1}
                            onClick={goNextMonth}
                            aria-label="Next month"
                            data-testid="date-picker-next-month"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                    <div
                        className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium"
                        aria-hidden="true"
                    >
                        {WEEKDAYS.map((day) => (
                            <span key={day} className="py-1">
                                {day}
                            </span>
                        ))}
                    </div>
                    <div
                        className="grid grid-cols-7 gap-1"
                        data-testid="date-picker-grid"
                    >
                        {Array.from({ length: blankDays }, (_, index) => (
                            <span key={`blank-${index}`} className="size-8" />
                        ))}
                        {Array.from({ length: totalDays }, (_, index) => {
                            const day = index + 1;
                            const key = formatDate(viewYear, viewMonth, day);
                            const isSelected = selectedKey === key;
                            const isToday = todayKey === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    tabIndex={-1}
                                    data-testid={`date-picker-day-${key}`}
                                    data-selected={isSelected ? 'true' : 'false'}
                                    data-today={isToday ? 'true' : 'false'}
                                    aria-label={key}
                                    aria-current={
                                        isSelected ? 'date' : undefined
                                    }
                                    className={cn(
                                        'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex size-8 items-center justify-center rounded-md text-sm outline-none focus-visible:ring-[3px]',
                                        isSelected &&
                                            'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                                        !isSelected &&
                                            isToday &&
                                            'border-primary border',
                                    )}
                                    onClick={() => selectDay(day)}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                    <p
                        className="text-muted-foreground mt-3 text-center text-xs"
                        data-testid="date-picker-format-hint"
                    >
                        Format: YYYY-MM-DD
                    </p>
                </div>
            ) : null}
        </div>
    );
}

export { DatePicker, formatDate, parseDate };
