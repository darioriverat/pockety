import { usePage } from '@inertiajs/react';
import { Github, BookOpen } from 'lucide-react';

export function AppFooter() {
    const { name, version } = usePage().props;
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
                            © {currentYear} All rights reserved
                        </p>
                    </div>

                    {/* Right: Useful links */}
                    <div className="flex gap-6">
                        <a
                            href="https://github.com/dariorivera/pockety"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Github className="h-4 w-4" />
                            <span>Repository</span>
                        </a>
                        <a
                            href="https://github.com/dariorivera/pockety#readme"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <BookOpen className="h-4 w-4" />
                            <span>Documentation</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
