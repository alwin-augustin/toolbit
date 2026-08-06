import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { lazy, Suspense } from "react";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WorkspaceShell } from "@/v2/WorkspaceShell";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { LoadingFallback } from "@/components/LoadingFallback";
import { isElectronApp } from "@/hooks/use-electron";

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));

// Dev preview of the v2 design system — lazy so its stylesheet only
// loads when the route is visited and never leaks into the legacy app.
const DesignSystemPreview = lazy(() => import("@/pages/design-system-preview"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LandingPage = lazy(() => import("@/components/LandingPage").then((module) => ({ default: module.LandingPage })));

function App() {
    const useHashRouter =
        typeof window !== "undefined" &&
        (window.location.protocol === "file:" || isElectronApp());

    return (
        <Router hook={useHashRouter ? useHashLocation : undefined}>
            <ErrorBoundary>
                <TooltipProvider>
                    <Switch>
                        {/* The application is the primary experience. */}
                        <Route path="/">
                            <WorkspaceShell>
                                <AppRouter />
                            </WorkspaceShell>
                        </Route>

                        {/* SEO and product context page */}
                        <Route path="/about">
                            <Suspense fallback={<LoadingFallback />}>
                                <LandingPage />
                            </Suspense>
                        </Route>
                        <Route path="/about.html">
                            <Suspense fallback={<LoadingFallback />}>
                                <LandingPage />
                            </Suspense>
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

                        {/* Dev-only design system preview (issue #13) */}
                        <Route path="/design-system">
                            <Suspense fallback={<LoadingFallback />}>
                                <DesignSystemPreview />
                            </Suspense>
                        </Route>

                        {/* App routes with v2 workspace shell */}
                        <Route path="/app">
                            <WorkspaceShell>
                                <AppRouter />
                            </WorkspaceShell>
                        </Route>
                        <Route path="/app/:rest*">
                            <WorkspaceShell>
                                <AppRouter />
                            </WorkspaceShell>
                        </Route>

                        {/* Prerendered marketing pages (/tools, /compare, guides)
                            are served as static files, so anything reaching the
                            SPA here is genuinely unknown. */}
                        <Route>
                            <Suspense fallback={<LoadingFallback />}>
                                <NotFound />
                            </Suspense>
                        </Route>
                    </Switch>
                    <Toaster />
                    <OfflineIndicator />
                </TooltipProvider>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
