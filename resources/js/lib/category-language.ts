export type CategoryLanguage = 'es' | 'en';

export type CategoryNameFields = {
    name_es: string;
    name_en: string;
};

export function isCategoryLanguage(value: unknown): value is CategoryLanguage {
    return value === 'es' || value === 'en';
}

export function categoryDisplayName(
    category: CategoryNameFields,
    language: CategoryLanguage,
): string {
    return language === 'es' ? category.name_es : category.name_en;
}
