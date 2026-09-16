import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    categoryDisplayName,
    isCategoryLanguage,
    type CategoryLanguage,
    type CategoryNameFields,
} from '@/lib/category-language';
import type { Auth } from '@/types';

type PageProps = {
    auth?: Auth;
};

export type UseCategoryLanguageReturn = {
    readonly language: CategoryLanguage;
    readonly setLanguage: (language: CategoryLanguage) => void;
    readonly getCategoryName: (category: CategoryNameFields) => string;
};

export function useCategoryLanguage(
    initialLanguage?: CategoryLanguage,
): UseCategoryLanguageReturn {
    const { auth } = usePage<PageProps>().props;
    const preferred = auth?.user?.category_language;
    const fallback: CategoryLanguage = isCategoryLanguage(initialLanguage)
        ? initialLanguage
        : isCategoryLanguage(preferred)
          ? preferred
          : 'en';

    const [language, setLanguageState] = useState<CategoryLanguage>(fallback);

    useEffect(() => {
        if (isCategoryLanguage(preferred)) {
            setLanguageState(preferred);
        }
    }, [preferred]);

    const setLanguage = (next: CategoryLanguage): void => {
        if (!isCategoryLanguage(next)) {
            return;
        }
        setLanguageState(next);
    };

    const getCategoryName = (category: CategoryNameFields): string =>
        categoryDisplayName(category, language);

    return { language, setLanguage, getCategoryName } as const;
}
