import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePeriod } from '@/hooks/use-period';
import { formatPeriod, generatePeriods } from '@/lib/periods';
import { cn } from '@/lib/utils';

type PeriodSelectorProps = {
    value?: string;
    onValueChange?: (period: string) => void;
    id?: string;
    label?: string;
    className?: string;
    showLabel?: boolean;
    testId?: string;
};

export function PeriodSelector({
    value,
    onValueChange,
    id = 'period',
    label = 'Period',
    className,
    showLabel = true,
    testId = 'period-selector',
}: PeriodSelectorProps) {
    const { period, setPeriod } = usePeriod();
    const periods = generatePeriods();

    return (
        <div className={cn('w-full max-w-xs space-y-2', className)}>
            {showLabel ? <Label htmlFor={id}>{label}</Label> : null}
            <Select
                value={value ?? period}
                onValueChange={(next) => {
                    setPeriod(next);
                    onValueChange?.(next);
                }}
            >
                <SelectTrigger id={id} data-testid={testId} aria-label={label}>
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    {periods.map((item) => (
                        <SelectItem key={item} value={item}>
                            {formatPeriod(item)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
