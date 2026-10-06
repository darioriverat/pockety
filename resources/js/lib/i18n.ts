import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en/translation.json';
import es from '@/locales/es/translation.json';

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(locale: unknown): AppLocale {
    if (locale === 'es') {
        return 'es';
    }

    return 'en';
}

export function applyDocumentLang(locale: AppLocale): void {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
    }
}

void i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        es: { translation: es },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    interpolation: {
        escapeValue: false,
    },
    returnNull: false,
});

export default i18n;
