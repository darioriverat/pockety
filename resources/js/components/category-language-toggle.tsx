import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    isCategoryLanguage,
    type CategoryLanguage,
} from '@/lib/category-language';

type CategoryLanguageToggleProps = {
    value: CategoryLanguage;
    onChange: (language: CategoryLanguage) => void;
    className?: string;
};

export function CategoryLanguageToggle({
    value,
    onChange,
    className,
}: CategoryLanguageToggleProps) {
    return (
        <div
            className={className ?? 'flex items-center gap-2'}
            data-testid="category-language-toggle"
        >
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Category names
            </span>
            <ToggleGroup
                type="single"
                value={value}
                onValueChange={(next) => {
                    if (isCategoryLanguage(next)) {
                        onChange(next);
                    }
                }}
                variant="outline"
                size="sm"
                aria-label="Category name language"
            >
                <ToggleGroupItem
                    value="es"
                    aria-label="Show Spanish category names"
                    data-testid="category-language-toggle-es"
                >
                    ES
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="en"
                    aria-label="Show English category names"
                    data-testid="category-language-toggle-en"
                >
                    EN
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}
