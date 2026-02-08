import { useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarToggle } from "@/components/SidebarToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { useSidebar } from "@/hooks/use-sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceManager } from "@/components/WorkspaceManager";
import { MobileActionButton } from "@/components/MobileActionButton";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { isOpen, close } = useSidebar();

    // Close sidebar on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, close]);

    return (
        <>
            {/* Skip to main content link for screen readers */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring"
            >
                Skip to main content
            </a>
            <div className="min-h-screen bg-background font-sans antialiased">
                <div className="relative flex min-h-screen">
                    {/* Mobile backdrop overlay */}
                    {isOpen && (
                        <div
                            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                            onClick={close}
                            aria-hidden="true"
                        />
                    )}
                    <AppSidebar />
                    <div className="flex-1 flex flex-col transition-all duration-150 ease-out">
                        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
                            <div className="flex items-center gap-4">
                                <SidebarToggle />
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* Search button */}
                                <Button
                                    variant="outline"
                                    className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        // Trigger command palette
                                        const event = new KeyboardEvent('keydown', {
                                            key: 'k',
                                            metaKey: true,
                                            bubbles: true
                                        });
                                        document.dispatchEvent(event);
                                    }}
                                >
                                    <Search className="h-4 w-4" />
                                    <span className="text-sm">Search tools...</span>
                                    <kbd className="hidden md:inline-flex ml-2 px-1.5 py-0.5 rounded bg-muted text-xs">
                                        ⌘K
                                    </kbd>
                                </Button>
                                {/* Mobile search icon */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="sm:hidden"
                                    onClick={() => {
                                        const event = new KeyboardEvent('keydown', {
                                            key: 'k',
                                            metaKey: true,
                                            bubbles: true
                                        });
                                        document.dispatchEvent(event);
                                    }}
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                                <WorkspaceManager />
                                <ThemeToggle />
                            </div>
                        </header>
                        <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8" tabIndex={-1}>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </main>
                        <Footer />
                    </div>
                </div>
                <MobileActionButton />
            </div>
        </>
    );
}
