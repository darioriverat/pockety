import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { applyDocumentLang, normalizeLocale } from '@/lib/i18n';

/**
 * Keep react-i18next and <html lang> in sync with auth.user.locale.
 */
export function useLocaleSync(): void {
    const { auth } = usePage().props;
    const { i18n } = useTranslation();
    const locale = normalizeLocale(auth?.user?.locale);

    useEffect(() => {
        if (i18n.language !== locale) {
            void i18n.changeLanguage(locale);
        }
        applyDocumentLang(locale);
    }, [i18n, locale]);
}
