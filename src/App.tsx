import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/components/LandingPage";
import { AppLayout } from "@/components/AppLayout";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { CookieConsent } from "@/components/CookieConsent";
import { LoadingFallback } from "@/components/LoadingFallback";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { SmartSuggestion } from "@/components/SmartSuggestion";
import { AriaLiveAnnouncer } from "@/components/AriaLiveAnnouncer";

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));

function App() {
    return (
        <ErrorBoundary>
            <AriaLiveAnnouncer>
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
                    <Route path="/app/:rest*">
                        <AppLayout>
                            <AppRouter />
                        </AppLayout>
                    </Route>
                </Switch>
                <Toaster />
                <OfflineIndicator />
                <CookieConsent />
                <CommandPalette />
                <KeyboardShortcutsHelp />
                <SmartSuggestion />
            </TooltipProvider>
            </AriaLiveAnnouncer>
        </ErrorBoundary>
    );
}

export default App;