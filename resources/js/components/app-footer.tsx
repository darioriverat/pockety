import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export function AppFooter() {
    const { name, version } = usePage().props;
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-border bg-muted/30 py-6">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    {/* Left: App name and copyright */}
                    <div className="text-center text-sm text-muted-foreground md:text-left">
                        <p className="font-medium">
                            {name} <span className="font-normal">v{version}</span>
                        </p>
                        <p className="mt-1">
                            © {currentYear} {t('footer.rights')}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
