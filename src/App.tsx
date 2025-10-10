import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "./hooks/use-theme";
import { useEffect } from "react";
import { Route, Switch } from "wouter";

// Import theme URLs using Vite's ?url suffix
import darkThemeUrl from 'prismjs/themes/prism-okaidia.css?url';
import lightThemeUrl from 'prismjs/themes/prism-solarizedlight.css?url';
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/components/LandingPage";
import { AppLayout } from "@/components/AppLayout";

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

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Switch>
                        {/* Landing page route */}
                        <Route path="/">
                            <LandingPage />
                        </Route>

                        {/* App routes with sidebar layout */}
                        <Route path="/app/:rest*">
                            <AppLayout>
                                <AppRouter />
                            </AppLayout>
                        </Route>
                    </Switch>
                    <Toaster />
                </TooltipProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;