import { useRef, useState } from 'react';
import { safeStorage, usePreferences } from '@/lib/preferences';
import { clearAllHistory, pruneExpiredHistory } from '@/lib/history-db';
import { useFocusTrap } from './use-focus-trap';
export function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(true, ref, onClose);
  const { analytics, history, retentionDays, update } = usePreferences();
  const [message, setMessage] = useState('');
  return (
    <div className="tb-phase-scrim" onClick={onClose}>
      <aside
        ref={ref}
        className="tb-phase-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tb-phase-panel-header">
          <h2 id="preferences-title">Privacy and storage</h2>
          <button onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </header>
        <div className="tb-phase-panel-body">
          <p>
            Tools process data locally. HTTP and WebSocket tools contact endpoints only when
            requested. Smart Paste uses deterministic detection, not AI.
          </p>
          <label>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => update({ analytics: e.target.checked })}
            />{' '}
            Product analytics
          </label>
          <p>
            Optional, minimized usage events use a pseudonymous device ID. Turning analytics off
            stops collection and removes this identity. Analytics may be unavailable when blocked or
            unconfigured.
          </p>
          <label>
            <input
              type="checkbox"
              checked={history}
              onChange={(e) => update({ history: e.target.checked })}
            />{' '}
            Save normal tool history locally
          </label>
          <p>
            Password, TOTP, JWT, certificate, Wi-Fi QR, Docker environment and network request tools
            are excluded. Existing history is retained until you clear it.
          </p>
          <label>
            History retention{' '}
            <select
              aria-label="History retention"
              value={retentionDays}
              onChange={(e) => update({ retentionDays: Number(e.target.value) })}
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <button
            onClick={async () => {
              try {
                await pruneExpiredHistory();
                setMessage('Expired history removed.');
              } catch {
                setMessage('History storage is unavailable.');
              }
            }}
          >
            Apply retention to existing history
          </button>
          <button
            onClick={async () => {
              try {
                await clearAllHistory();
                setMessage('All tool history cleared.');
              } catch {
                setMessage('History storage is unavailable.');
              }
            }}
          >
            Clear all tool history
          </button>
          <button
            onClick={() => {
              safeStorage.removeItem('toolbit-totp-accounts');
              safeStorage.removeItem('toolbit-api-requests');
              setMessage('Legacy saved credentials removed from browser storage.');
            }}
          >
            Remove legacy saved accounts and requests
          </button>
          <p role="status">{message}</p>
          <p>
            Workspace payloads require “Include data” when saving. Recipe files contain tool
            settings only. Browser storage is unencrypted; do not save secrets in snippets.
          </p>
        </div>
      </aside>
    </div>
  );
}
