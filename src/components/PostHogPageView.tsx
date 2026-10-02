import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { isPostHogEnabled, posthog } from '@/lib/posthog';

/** Captures SPA navigations without including query parameters or fragment data. */
export function PostHogPageView() {
  const [location] = useLocation();

  useEffect(() => {
    if (!isPostHogEnabled) return;

    posthog.capture('$pageview', {
      $current_url: `${window.location.origin}${location}`,
      path: location,
    });
  }, [location]);

  return null;
}
