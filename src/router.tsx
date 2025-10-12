import { Switch, Route, Redirect } from "wouter";
import { Suspense } from "react";
import { ToolErrorBoundary } from "@/components/ToolErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { TOOLS } from "@/config/tools.config";

/**
 * Auto-generated App Router
 * Routes are automatically generated from tool metadata configuration
 */
export function AppRouter() {
    return (
        <Switch>
            {/* Redirect /app to default tool */}
            <Route path="/app">
                <Redirect to="/app/json-formatter" />
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
        </Switch>
    );
}
