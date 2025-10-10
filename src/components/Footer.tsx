import { ExternalLink, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Footer() {
    const [location] = useLocation();
    const isAppRoute = location.startsWith('/app');

    return (
        <footer className="border-t border-border bg-background/50 backdrop-blur-sm px-6 py-4 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {isAppRoute && (
                    <>
                        <Link href="/">
                            <a className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                                <Home className="h-3 w-3" />
                                Home
                            </a>
                        </Link>
                        <span className="text-muted-foreground/40">•</span>
                    </>
                )}
                <a
                    href="https://github.com/alwin-augustin/toolbit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                    GitHub
                    <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-muted-foreground/40">•</span>
                <a
                    href="https://github.com/alwin-augustin/toolbit/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                    Feedback
                    <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground/70">
                    Your data never leaves your device — Toolbit runs locally
                </span>
            </div>
        </footer>
    );
}
