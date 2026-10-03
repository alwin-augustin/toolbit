import { Route, Switch, Router, Redirect, useLocation } from 'wouter';
import { lazy, Suspense } from 'react';
import { AppRouter } from '@/app/router';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { WorkspaceShell } from '@/app/shell/WorkspaceShell';
import { OfflineIndicator } from '@/app/components/OfflineIndicator';
import { LoadingFallback } from '@/app/components/LoadingFallback';
import { TOOLS } from '@/content/tools.config';
import { PostHogPageView } from '@/app/components/PostHogPageView';

/**
 * Tools live at the root: /json-formatter, not /app/json-formatter.
 *
 * Matching on the known tool ids rather than a bare /:slug keeps the root
 * namespace shared safely with the marketing and legal pages — an unknown
 * slug falls through to the 404 instead of booting an empty workspace.
 */
const TOOL_PATH_PATTERN = new RegExp(`^/(?:${TOOLS.map((tool) => tool.id).join('|')})/?$`);

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import('@/app/pages/privacy-policy'));
const TermsOfService = lazy(() => import('@/app/pages/terms-of-service'));

const NotFound = lazy(() => import('@/app/pages/not-found'));
const LandingPage = lazy(() =>
  import('@/app/pages/landing').then((module) => ({ default: module.LandingPage })),
);

function App() {
  return (
    <Router>
      <PostHogPageView />
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
          {/* The application is the primary experience. */}
          <Route path="/">
            <WorkspaceShell>
              <AppRouter />
            </WorkspaceShell>
          </Route>

          {/* Workbench screens share the shell. */}
          <Route path="/library">
            <WorkspaceShell>
              <AppRouter />
            </WorkspaceShell>
          </Route>
          <Route path="/saved">
            <WorkspaceShell>
              <AppRouter />
            </WorkspaceShell>
          </Route>
          <Route path="/history">
            <WorkspaceShell>
              <AppRouter />
            </WorkspaceShell>
          </Route>
          <Route path="/settings">
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
            {(params) => <Redirect to={`/${params['rest*'] ?? ''}`} replace />}
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
        <OfflineIndicator />
    </ErrorBoundary>
  );
}

export default App;
