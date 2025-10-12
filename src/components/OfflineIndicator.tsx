/**
 * Offline Indicator Component
 * Shows connection status and PWA update notifications
 */

import { useEffect, useState } from 'react';
import { WifiOff, Download } from 'lucide-react';
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
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setHasUpdate(true);
                                setWaitingWorker(newWorker);
                            }
                        });
                    }
                });
            });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    };

    if (!isOnline) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-destructive-foreground shadow-lg">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">You're offline</span>
            </div>
        );
    }

    if (hasUpdate) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg">
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Update available</span>
                <Button
                    onClick={handleUpdate}
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                >
                    Update Now
                </Button>
            </div>
        );
    }

    return null;
}
