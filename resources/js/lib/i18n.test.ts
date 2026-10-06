import { beforeEach, describe, expect, it } from 'vitest';
import i18n, { applyDocumentLang, normalizeLocale } from '@/lib/i18n';

describe('i18n', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('en');
        applyDocumentLang('en');
    });

    it('normalizes unsupported locales to en', () => {
        expect(normalizeLocale('es')).toBe('es');
        expect(normalizeLocale('en')).toBe('en');
        expect(normalizeLocale('fr')).toBe('en');
        expect(normalizeLocale(undefined)).toBe('en');
    });

    it('falls back to English when a Spanish key is missing', async () => {
        await i18n.changeLanguage('es');
        // Intentionally absent from the Spanish catalog
        i18n.addResource('en', 'translation', 'test.missingSpanishOnly', 'English fallback value');

        expect(i18n.t('test.missingSpanishOnly')).toBe('English fallback value');
        expect(i18n.t('test.missingSpanishOnly')).not.toBe('test.missingSpanishOnly');
    });

    it('sets documentElement lang to en or es', async () => {
        applyDocumentLang('es');
        expect(document.documentElement.lang).toBe('es');

        applyDocumentLang('en');
        expect(document.documentElement.lang).toBe('en');
    });

    it('translates navigation chrome', async () => {
        expect(i18n.t('nav.dashboard')).toBe('Dashboard');
        await i18n.changeLanguage('es');
        expect(i18n.t('nav.dashboard')).toBe('Panel');
        expect(i18n.t('nav.preferences')).toBe('Preferencias');
    });
});
