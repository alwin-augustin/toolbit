import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { ToolErrorBoundary } from "@/components/ToolErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { TOOLS } from "@/config/tools.config";

const AppHome = lazy(() => import("@/components/AppHome"));

/**
 * Auto-generated App Router
 * Routes are automatically generated from tool metadata configuration
 */
export function AppRouter() {
    return (
        <Switch>
            {/* App home dashboard */}
            <Route path={/^\/app\/?$/}>
                <Suspense fallback={<LoadingFallback />}>
                    <AppHome />
                </Suspense>
            </Route>

            {/* Auto-generated tool routes from metadata */}
            {TOOLS.map(({ id, path, component: Component, name }) => (
                <Route key={id} path={path}>
                    <ToolErrorBoundary toolName={name}>
                        <Suspense fallback={<LoadingFallback />}>
                            <Component />
                        </Suspense>
                    </ToolErrorBoundary>
                </Route>
            ))}

            {/* Fallback to dashboard if no tool route matches */}
            <Route path="/app/:rest*">
                <Suspense fallback={<LoadingFallback />}>
                    <AppHome />
                </Suspense>
            </Route>
        </Switch>
    );
}
