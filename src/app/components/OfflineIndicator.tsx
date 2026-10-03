/**
 * Offline Indicator Component
 * Shows connection status and PWA update notifications
 */

import { useEffect, useState } from 'react';
import { IconWifiOff as WifiOff, IconDownload as Download } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for PWA updates
    let cancelled = false;
    let registrationRef: ServiceWorkerRegistration | null = null;
    const onUpdateFound = () => {
      const newWorker = registrationRef?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !cancelled) {
            setHasUpdate(true);
            setWaitingWorker(newWorker as ServiceWorker);
          }
        });
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (cancelled) return;
          registrationRef = registration;
          if (registration.waiting) {
            setHasUpdate(true);
            setWaitingWorker(registration.waiting);
          }
          registration.addEventListener('updatefound', onUpdateFound);
        })
        .catch(() => {
          /* service worker unavailable — tools still run */
        });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      registrationRef?.removeEventListener('updatefound', onUpdateFound);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
        once: true,
      });
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!isOnline) {
    return (
      <div
        role="alert"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-destructive-foreground shadow-lg"
      >
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    );
  }

  if (hasUpdate) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">
          Update available. Save your work before reloading.
        </span>
        <Button onClick={handleUpdate} variant="secondary" size="sm" className="h-7 text-xs">
          Reload to update
        </Button>
      </div>
    );
  }

  return null;
}
