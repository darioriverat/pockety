import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import {
    TrendingUpIcon,
    TrendingDownIcon,
    WalletIcon,
    CreditCardIcon,
    ScaleIcon,
    CheckCircleIcon,
    AlertCircleIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardSummary {
    period: string;
    total_income_cad: number;
    total_expenses_cad: number;
    net_cad: number;
    total_assets_cad: number;
    total_liabilities_cad: number;
    equity_cad: number;
    reconciliation_status: 'balanced' | 'unbalanced';
    reconciliation_summary: {
        balanced_count: number;
        unbalanced_count: number;
        total_count: number;
    };
}

interface DashboardProps {
    summary: DashboardSummary;
}

export default function Dashboard({ summary }: DashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
        }).format(amount);
    };

    const formatPeriod = (period: string) => {
        const year = period.substring(0, 4);
        const month = period.substring(4, 6);
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const netIsPositive = summary.net_cad >= 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Period Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Financial overview for {formatPeriod(summary.period)}
                        </p>
                    </div>
                    <Badge variant={summary.reconciliation_status === 'balanced' ? 'default' : 'destructive'}>
                        {summary.reconciliation_status === 'balanced' ? (
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                        ) : (
                            <AlertCircleIcon className="mr-1 h-3 w-3" />
                        )}
                        {summary.reconciliation_status.charAt(0).toUpperCase() + summary.reconciliation_status.slice(1)}
                    </Badge>
                </div>

                {/* Income, Expenses, Net Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                            <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.total_income_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                All income sources
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <TrendingDownIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.total_expenses_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                All expense categories
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net</CardTitle>
                            <ScaleIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.net_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                Income - Expenses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Assets, Liabilities, Equity Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                            <WalletIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.total_assets_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                All bank accounts & investments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                            <CreditCardIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(summary.total_liabilities_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                Credit cards & loans
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Equity</CardTitle>
                            <ScaleIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(summary.equity_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                Assets - Liabilities
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Reconciliation Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ScaleIcon className="h-5 w-5" />
                            Reconciliation Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {summary.reconciliation_summary.balanced_count} of{' '}
                                    {summary.reconciliation_summary.total_count} accounts balanced
                                </p>
                                {summary.reconciliation_summary.unbalanced_count > 0 && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {summary.reconciliation_summary.unbalanced_count} account
                                        {summary.reconciliation_summary.unbalanced_count !== 1 ? 's' : ''} need
                                        {summary.reconciliation_summary.unbalanced_count === 1 ? 's' : ''} attention
                                    </p>
                                )}
                            </div>
                            <a
                                href="/reconciliation"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                View Details →
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
