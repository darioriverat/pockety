import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;
    const brandName = name && name !== 'Laravel' ? name : 'Pockety';

    return (
        <>
            <div
                data-testid="app-logo-mark"
                className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md"
            >
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span
                    data-testid="app-brand-name"
                    className="mb-0.5 truncate leading-tight font-semibold tracking-tight"
                >
                    {brandName}
                </span>
            </div>
        </>
    );
}
