import { describe, expect, it } from 'vitest';
import {
    categoryDisplayName,
    isCategoryLanguage,
} from './category-language';

describe('category language helpers', () => {
    const category = {
        name_es: 'MERCADO',
        name_en: 'Groceries',
    };

    it('validates language codes', () => {
        expect(isCategoryLanguage('es')).toBe(true);
        expect(isCategoryLanguage('en')).toBe(true);
        expect(isCategoryLanguage('fr')).toBe(false);
        expect(isCategoryLanguage(null)).toBe(false);
    });

    it('returns Spanish or English display names', () => {
        expect(categoryDisplayName(category, 'es')).toBe('MERCADO');
        expect(categoryDisplayName(category, 'en')).toBe('Groceries');
    });
});
