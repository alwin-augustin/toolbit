import { ExternalLink, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";

export function Footer() {
    const [location] = useLocation();
    // Tools live at the root, so "am I in a tool?" is a lookup rather than a
    // prefix check.
    const isAppRoute = TOOLS.some((tool) => tool.path === location.replace(/\/$/, ""));

    return (
        <footer className="border-t border-border bg-background/50 backdrop-blur-sm px-6 py-4 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {isAppRoute && (
                    <>
                        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                            <Home className="h-3 w-3" />
                            Home
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
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                </Link>
                <span className="text-muted-foreground/40">•</span>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms
                </Link>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground/70">
                    Local processing · optional analytics
                </span>
            </div>
        </footer>
    );
}
