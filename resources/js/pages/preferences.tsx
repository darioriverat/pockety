import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { update as updatePreferences } from '@/routes/preferences';
import { PageContainer } from '@/components/page-container';

interface User {
    id: number;
    name: string;
    email: string;
    default_currency: string;
    locale?: string;
}

interface LocaleOption {
    value: string;
    label: string;
}

interface PreferencesProps {
    user: User;
    available_currencies: string[];
    available_locales: LocaleOption[];
}

export default function Preferences({
    user,
    available_currencies,
    available_locales,
}: PreferencesProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        default_currency: user.default_currency || 'CAD',
        locale: user.locale || 'en',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(updatePreferences.url());
    }

    return (
        <>
            <Head title={t('preferences.title')} />

            <PageContainer>
                    <Card data-testid="preferences-card">
                        <CardHeader>
                            <CardTitle>{t('preferences.cardTitle')}</CardTitle>
                            <CardDescription>
                                {t('preferences.cardDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submit}
                                className="space-y-6"
                                data-testid="preferences-form"
                            >
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="locale">
                                            {t('preferences.language')}
                                        </Label>
                                        <Select
                                            value={data.locale}
                                            onValueChange={(value) =>
                                                setData('locale', value)
                                            }
                                        >
                                            <SelectTrigger
                                                id="locale"
                                                data-testid="locale-select"
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'preferences.selectLanguage',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {available_locales.map((locale) => (
                                                    <SelectItem
                                                        key={locale.value}
                                                        value={locale.value}
                                                        data-testid={`locale-option-${locale.value}`}
                                                    >
                                                        {locale.value === 'es'
                                                            ? t('preferences.spanish')
                                                            : t('preferences.english')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.locale && (
                                            <p className="text-sm text-red-600">
                                                {errors.locale}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            {t('preferences.languageHelp')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="default_currency">
                                            {t('preferences.defaultCurrency')}
                                        </Label>
                                        <Select
                                            value={data.default_currency}
                                            onValueChange={(value) =>
                                                setData('default_currency', value)
                                            }
                                        >
                                            <SelectTrigger
                                                id="default_currency"
                                                data-testid="default-currency-select"
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'preferences.selectCurrency',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {available_currencies.map((currency) => (
                                                    <SelectItem
                                                        key={currency}
                                                        value={currency}
                                                        data-testid={`currency-option-${currency.toLowerCase()}`}
                                                    >
                                                        {currency}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.default_currency && (
                                            <p className="text-sm text-red-600">
                                                {errors.default_currency}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            {t('preferences.currencyHelp')}
                                        </p>
                                    </div>
                                </div>

                                {recentlySuccessful && (
                                    <Alert data-testid="preferences-success">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertDescription>
                                            {t('preferences.success')}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        data-testid="preferences-save"
                                    >
                                        {processing
                                            ? t('preferences.saving')
                                            : t('preferences.save')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
            </PageContainer>
        </>
    );
}

Preferences.layout = {
    breadcrumbs: [
        {
            title: 'Preferences',
            titleKey: 'nav.preferences',
            href: '/preferences',
        },
    ],
};
