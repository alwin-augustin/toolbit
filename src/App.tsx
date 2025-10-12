import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/components/LandingPage";
import { AppLayout } from "@/components/AppLayout";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function App() {
    return (
        <ErrorBoundary>
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
                <OfflineIndicator />
            </TooltipProvider>
        </ErrorBoundary>
    );
}

export default App;