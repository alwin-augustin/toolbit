import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarToggle } from "@/components/SidebarToggle";
import { useTheme } from "./hooks/use-theme";
import { useEffect } from "react";

// Import theme URLs using Vite's ?url suffix
import darkThemeUrl from 'prismjs/themes/prism-okaidia.css?url';
import lightThemeUrl from 'prismjs/themes/prism-solarizedlight.css?url';
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppRouter } from "./router";
import { useSidebar } from "@/hooks/use-sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";

function App() {
    const { theme } = useTheme();

    useEffect(() => {
        const existingLink = document.querySelector('link[data-prism-theme]');
        if (existingLink) {
            existingLink.remove();
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.setAttribute('data-prism-theme', 'true');
        link.href = theme === 'dark' ? darkThemeUrl : lightThemeUrl;

        document.head.appendChild(link);
    }, [theme]);
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
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
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
                                    <div className="flex items-center gap-4">
                                        <ThemeToggle />
                                    </div>
                                </header>
                                <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8" tabIndex={-1}>
                                    <ErrorBoundary>
                                        <AppRouter />
                                    </ErrorBoundary>
                                </main>
                                <Footer />
                            </div>
                        </div>
                    </div>
                    <Toaster />
                </TooltipProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;