import { Head, useForm } from '@inertiajs/react';
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

interface User {
    id: number;
    name: string;
    email: string;
    default_currency: string;
    category_language: string;
}

interface PreferencesProps {
    user: User;
    available_currencies: string[];
    available_category_languages: string[];
}

const LANGUAGE_LABELS: Record<string, string> = {
    es: 'Spanish',
    en: 'English',
};

export default function Preferences({
    user,
    available_currencies,
    available_category_languages,
}: PreferencesProps) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        default_currency: user.default_currency || 'CAD',
        category_language: user.category_language || 'en',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(updatePreferences.url());
    }

    return (
        <>
            <Head title="Preferences" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <Card data-testid="preferences-card">
                        <CardHeader>
                            <CardTitle>User Preferences</CardTitle>
                            <CardDescription>
                                Manage your account preferences and display settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submit}
                                className="space-y-6"
                                data-testid="preferences-form"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="default_currency">
                                        Default Currency
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
                                            <SelectValue placeholder="Select currency" />
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
                                        Choose your preferred currency for displaying amounts
                                        throughout the application. You can still toggle
                                        currencies on the dashboard at any time.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category_language">
                                        Category Name Language
                                    </Label>
                                    <Select
                                        value={data.category_language}
                                        onValueChange={(value) =>
                                            setData('category_language', value)
                                        }
                                    >
                                        <SelectTrigger
                                            id="category_language"
                                            data-testid="category-language-select"
                                        >
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {available_category_languages.map(
                                                (language) => (
                                                    <SelectItem
                                                        key={language}
                                                        value={language}
                                                        data-testid={`category-language-option-${language}`}
                                                    >
                                                        {LANGUAGE_LABELS[language] ??
                                                            language}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_language && (
                                        <p className="text-sm text-red-600">
                                            {errors.category_language}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Choose whether category names default to Spanish or
                                        English. You can still toggle the language on the
                                        categories and transactions pages.
                                    </p>
                                </div>

                                {recentlySuccessful && (
                                    <Alert data-testid="preferences-success">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertDescription>
                                            Preferences updated successfully!
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        data-testid="preferences-save"
                                    >
                                        {processing ? 'Saving...' : 'Save Preferences'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Preferences.layout = {
    breadcrumbs: [
        {
            title: 'Preferences',
            href: '/preferences',
        },
    ],
};
