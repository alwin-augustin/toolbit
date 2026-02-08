import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { lazy, Suspense } from "react";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/components/LandingPage";
import { AppLayout } from "@/components/AppLayout";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { LoadingFallback } from "@/components/LoadingFallback";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { isElectronApp } from "@/hooks/use-electron";

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));

function App() {
    const useHashRouter =
        typeof window !== "undefined" &&
        (window.location.protocol === "file:" || isElectronApp());

    return (
        <Router hook={useHashRouter ? useHashLocation : undefined}>
            <ErrorBoundary>
                <TooltipProvider>
                    <Switch>
                        {/* Landing page route */}
                        <Route path="/">
                            <LandingPage />
                        </Route>

                        {/* Legal pages */}
                        <Route path="/privacy">
                            <Suspense fallback={<LoadingFallback />}>
                                <PrivacyPolicy />
                            </Suspense>
                        </Route>
                        <Route path="/terms">
                            <Suspense fallback={<LoadingFallback />}>
                                <TermsOfService />
                            </Suspense>
                        </Route>

                        {/* App routes with sidebar layout */}
                        <Route path="/app">
                            <AppLayout>
                                <AppRouter />
                            </AppLayout>
                        </Route>
                        <Route path="/app/:rest*">
                            <AppLayout>
                                <AppRouter />
                            </AppLayout>
                        </Route>
                    </Switch>
                    <Toaster />
                    <OfflineIndicator />
                    <CommandPalette />
                    <KeyboardShortcutsHelp />
                </TooltipProvider>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
