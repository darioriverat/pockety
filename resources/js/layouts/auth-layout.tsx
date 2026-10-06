import { useTranslation } from 'react-i18next';
import { useLocaleSync } from '@/hooks/use-locale-sync';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    useLocaleSync();
    const { t } = useTranslation();
    const resolvedTitle = title.includes('.') ? t(title) : title;
    const resolvedDescription = description.includes('.')
        ? t(description)
        : description;

    return (
        <AuthLayoutTemplate
            title={resolvedTitle}
            description={resolvedDescription}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
