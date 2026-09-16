import { router } from '@inertiajs/react';
import { Building2, Loader2, Receipt, Search, Tags } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type SearchHit = {
    type: 'account' | 'transaction' | 'category';
    id: number | string;
    title: string;
    subtitle: string | null;
    url: string;
};

export type SearchResults = {
    query: string;
    accounts: SearchHit[];
    transactions: SearchHit[];
    categories: SearchHit[];
    total: number;
};

type GlobalSearchProps = {
    className?: string;
};

async function fetchSearchResults(query: string): Promise<SearchResults> {
    const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=8`,
        {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        },
    );

    if (!response.ok) {
        throw new Error('Search request failed');
    }

    const payload = await response.json();
    return payload.data as SearchResults;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
    const inputId = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
        return () => window.clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (debounceRef.current !== null) {
            window.clearTimeout(debounceRef.current);
        }

        const trimmed = query.trim();
        if (!open || trimmed.length === 0) {
            setResults(null);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        debounceRef.current = window.setTimeout(() => {
            fetchSearchResults(trimmed)
                .then((data) => {
                    setResults(data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Unable to search right now.');
                    setLoading(false);
                });
        }, 250);

        return () => {
            if (debounceRef.current !== null) {
                window.clearTimeout(debounceRef.current);
            }
        };
    }, [query, open]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setQuery('');
            setResults(null);
            setError(null);
            setLoading(false);
        }
    };

    const navigateTo = (url: string) => {
        handleOpenChange(false);
        router.visit(url);
    };

    const hasQuery = query.trim().length > 0;
    const total = results?.total ?? 0;

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="global-search-trigger"
                className={cn(
                    'text-muted-foreground h-9 gap-2 px-3 font-normal',
                    className,
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="size-4" />
                <span className="hidden sm:inline">Search…</span>
                <kbd className="bg-muted text-muted-foreground pointer-events-none ml-1 hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
                    ⌘K
                </kbd>
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    data-testid="global-search-dialog"
                    className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
                >
                    <DialogHeader className="border-b px-4 py-3 text-left">
                        <DialogTitle>Search</DialogTitle>
                        <DialogDescription>
                            Find accounts, transactions, and categories
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border-b px-4 py-3">
                        <label htmlFor={inputId} className="sr-only">
                            Search query
                        </label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                ref={inputRef}
                                id={inputId}
                                data-testid="global-search-input"
                                placeholder="Search accounts, comments, categories…"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                className="pl-9"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div
                        data-testid="global-search-results"
                        className="max-h-[60vh] overflow-y-auto px-2 py-2"
                    >
                        {!hasQuery && (
                            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                                Type to search across accounts, transactions, and
                                categories.
                            </p>
                        )}

                        {hasQuery && loading && (
                            <div
                                data-testid="global-search-loading"
                                className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm"
                            >
                                <Loader2 className="size-4 animate-spin" />
                                Searching…
                            </div>
                        )}

                        {hasQuery && !loading && error && (
                            <p
                                data-testid="global-search-error"
                                className="text-destructive px-2 py-6 text-center text-sm"
                            >
                                {error}
                            </p>
                        )}

                        {hasQuery && !loading && !error && total === 0 && (
                            <p
                                data-testid="global-search-empty"
                                className="text-muted-foreground px-2 py-6 text-center text-sm"
                            >
                                No results for “{query.trim()}”.
                            </p>
                        )}

                        {hasQuery && !loading && !error && results && total > 0 && (
                            <div className="space-y-4 py-1">
                                <SearchSection
                                    title="Accounts"
                                    testId="global-search-accounts"
                                    icon={<Building2 className="size-4" />}
                                    hits={results.accounts}
                                    onSelect={navigateTo}
                                />
                                <SearchSection
                                    title="Transactions"
                                    testId="global-search-transactions"
                                    icon={<Receipt className="size-4" />}
                                    hits={results.transactions}
                                    onSelect={navigateTo}
                                />
                                <SearchSection
                                    title="Categories"
                                    testId="global-search-categories"
                                    icon={<Tags className="size-4" />}
                                    hits={results.categories}
                                    onSelect={navigateTo}
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SearchSection({
    title,
    testId,
    icon,
    hits,
    onSelect,
}: {
    title: string;
    testId: string;
    icon: ReactNode;
    hits: SearchHit[];
    onSelect: (url: string) => void;
}) {
    if (hits.length === 0) {
        return null;
    }

    return (
        <section data-testid={testId} className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 px-2 text-xs font-semibold tracking-wide uppercase">
                {icon}
                <span>
                    {title} ({hits.length})
                </span>
            </div>
            <ul className="space-y-0.5">
                {hits.map((hit) => (
                    <li key={`${hit.type}-${hit.id}`}>
                        <button
                            type="button"
                            data-testid={`global-search-hit-${hit.type}-${hit.id}`}
                            className="hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors"
                            onClick={() => onSelect(hit.url)}
                        >
                            <span className="text-sm font-medium">{hit.title}</span>
                            {hit.subtitle && (
                                <span className="text-muted-foreground text-xs">
                                    {hit.subtitle}
                                </span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
