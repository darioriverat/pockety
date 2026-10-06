import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Icon } from '@/components/ui/icon';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslation();

    return (
        <SidebarGroup className="px-2 py-0" data-testid="main-navigation">
            <SidebarGroupLabel>{t('nav.label')}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const label = item.titleKey ? t(item.titleKey) : item.title;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: label }}
                                className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    data-testid={`nav-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                    {item.icon ? (
                                        <Icon iconNode={item.icon} size="md" />
                                    ) : null}
                                    <span>{label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
