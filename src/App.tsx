import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WorkspaceShell } from "@/v2/WorkspaceShell";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { LoadingFallback } from "@/components/LoadingFallback";
import { TOOLS } from "@/config/tools.config";
import { PostHogPageView } from "@/components/PostHogPageView";

/**
 * Tools live at the root: /json-formatter, not /app/json-formatter.
 *
 * Matching on the known tool ids rather than a bare /:slug keeps the root
 * namespace shared safely with the marketing and legal pages — an unknown
 * slug falls through to the 404 instead of booting an empty workspace.
 */
const TOOL_PATH_PATTERN = new RegExp(`^/(?:${TOOLS.map((tool) => tool.id).join("|")})/?$`);

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));

// Dev preview of the v2 design system — lazy so its stylesheet only
// loads when the route is visited and never leaks into the legacy app.
const DesignSystemPreview = lazy(() => import("@/pages/design-system-preview"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LandingPage = lazy(() => import("@/components/LandingPage").then((module) => ({ default: module.LandingPage })));

function App() {
    return (
        <Router>
            <PostHogPageView />
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

                        {/* Tools, at the root of the site */}
                        <Route path={TOOL_PATH_PATTERN}>
                            <WorkspaceShell>
                                <AppRouter />
                            </WorkspaceShell>
                        </Route>

                        {/* Legacy /app URLs. Cloudflare 301s these before the
                            SPA ever sees them; this also covers in-page navigation. */}
                        <Route path="/app">{() => <Redirect to="/" replace />}</Route>
                        <Route path="/app/:rest*">
                            {(params) => <Redirect to={`/${params["rest*"] ?? ""}`} replace />}
                        </Route>

                        {/* Prerendered marketing pages (/tools, /compare, /blog,
                            guides) are served as static files, so anything
                            reaching the SPA here is genuinely unknown. */}
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
