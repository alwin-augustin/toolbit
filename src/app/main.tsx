import { registerServiceWorker } from '@/platform/service-worker';
import { createRoot } from 'react-dom/client';
import '@/platform/posthog';
import App from '@/app/App';
import '../index.css';
import { pruneExpiredHistory } from '@/core/history-db';

createRoot(document.getElementById('root')!).render(<App />);

registerServiceWorker();
// Enforce retention in the background; storage denial must never break boot.
void pruneExpiredHistory().catch(() => {});
