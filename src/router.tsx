import { DocumentContext } from "@/v2/document-state";
import { useWorkspace } from "@/v2/workspace-store";
import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { ToolErrorBoundary } from "@/components/ToolErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { TOOLS } from "@/config/tools.config";
import { V2_TOOL_OVERRIDES } from "@/v2/tools/registry";

const AppHome = lazy(() => import("@/components/AppHome"));

/**
 * Auto-generated App Router
 * Routes are automatically generated from tool metadata configuration
 */
export function AppRouter() {
    const active = useWorkspace(s=>s.activeTabId);
    return (
        <Switch>
            {/* App home dashboard */}
            <Route path={/^\/?$/}>
                <Suspense fallback={<LoadingFallback />}>
                    <AppHome />
                </Suspense>
            </Route>

            {/* Auto-generated tool routes from metadata — v2 implementations
                take precedence over legacy pages while the migration runs */}
            {TOOLS.map(({ id, path, component: LegacyComponent, name }) => {
                const Component = V2_TOOL_OVERRIDES[id] ?? LegacyComponent;
                return (
                    <Route key={id} path={path}>
                        <ToolErrorBoundary toolName={name}>
                            <Suspense fallback={<LoadingFallback />}>
                                <DocumentContext.Provider value={active}><Component key={active || id} /></DocumentContext.Provider>
                            </Suspense>
                        </ToolErrorBoundary>
                    </Route>
                );
            })}

            {/* Reached only when the shell was mounted for a path that is not a
                tool — fall back to the dashboard rather than an empty pane. */}
            <Route>
                <Suspense fallback={<LoadingFallback />}>
                    <AppHome />
                </Suspense>
            </Route>
        </Switch>
    );
}
