import { useState } from 'react';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePreferences } from '@/core/preferences';
import { clearAllHistory, pruneExpiredHistory } from '@/core/history-db';
import { setTheme, useTheme, type Theme } from '@/shared/theme';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const THEMES: Array<{ id: Theme; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

export function SettingsScreen() {
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const setWrap = useWorkbenchMemory((s) => s.setWrap);
  const remember = useWorkbenchMemory((s) => s.remember);
  const setRemember = useWorkbenchMemory((s) => s.setRemember);
  const theme = useTheme();
  const analytics = usePreferences((s) => s.analytics);
  const history = usePreferences((s) => s.history);
  const retentionDays = usePreferences((s) => s.retentionDays);
  const update = usePreferences((s) => s.update);
  const [status, setStatus] = useState('');

  const clearData = async () => {
    try {
      await clearAllHistory();
      setStatus('Stored history cleared.');
    } catch {
      setStatus('Storage unavailable. Session-only data clears on refresh.');
    }
  };

  const applyRetention = async () => {
    try {
      await pruneExpiredHistory();
      setStatus(`Applied ${retentionDays}-day retention.`);
    } catch {
      setStatus('Storage unavailable.');
    }
  };

  return (
    <>
      <div className="wb-page-heading">
        <h1>Settings</h1>
        <p>Choose how your workspace behaves.</p>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Theme</strong>
          <small>Follows your system appearance until you pick one. Saved on this device.</small>
        </span>
        <ToggleGroup
          aria-label="Theme"
          value={[theme]}
          onValueChange={(v) => setTheme((v[0] ?? 'system') as Theme)}
          variant="outline"
        >
          {THEMES.map((option) => (
            <ToggleGroupItem key={option.id} value={option.id}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <label className="wb-setting-row">
        <span>
          <strong>Wrap long lines</strong>
          <small>Keep code readable without horizontal scrolling.</small>
        </span>
        <Checkbox checked={wrap} onCheckedChange={(checked) => setWrap(Boolean(checked))} />
      </label>
      <label className="wb-setting-row">
        <span>
          <strong>Remember runs in this session</strong>
          <small>Optional history. No data is kept after refreshing.</small>
        </span>
        <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
      </label>
      <div className="wb-setting-row">
        <span>
          <strong>Privacy and storage</strong>
          <small>Local-first processing. Optional analytics excludes Tool input and output.</small>
        </span>
      </div>
      <label className="wb-setting-row">
        <span>
          <strong>Product analytics</strong>
          <small>Pseudonymous usage and error events. No Tool content is sent.</small>
        </span>
        <Checkbox
          checked={analytics}
          onCheckedChange={(checked) => update({ analytics: Boolean(checked) })}
        />
      </label>
      <label className="wb-setting-row">
        <span>
          <strong>Record history</strong>
          <small>Secret Tools never record. Applies going forward.</small>
        </span>
        <Checkbox
          checked={history}
          onCheckedChange={(checked) => update({ history: Boolean(checked) })}
        />
      </label>
      <div className="wb-setting-row">
        <span>
          <strong>Retention: {retentionDays} days</strong>
          <small>1 to 365 days. Expired entries are removed on request.</small>
        </span>
        <Input
          type="number"
          aria-label="Retention days"
          min={1}
          max={365}
          value={retentionDays}
          onChange={(e) =>
            update({
              retentionDays: Math.max(1, Math.min(365, Number(e.target.value) || 30)),
            })
          }
        />
      </div>
      <div className="wb-toolbar">
        <button type="button" className="wb-button" onClick={() => void applyRetention()}>
          Apply retention
        </button>
        <button type="button" className="wb-button" onClick={() => void clearData()}>
          Clear stored history
        </button>
        {status ? (
          <span role="status" aria-live="polite">
            {status}
          </span>
        ) : null}
      </div>
      <div className="wb-settings-info">
        <h2>Data stays on this device</h2>
        <p>
          Local transformations run in your browser. Tab structure is saved on this device without
          content. History and saved work are opt-in. Optional product analytics is off when you
          disable it above and never includes Tool input or output. API and WebSocket Tools send
          only the requests you explicitly run.
        </p>
        <h2>Keyboard shortcuts</h2>
        <p>Cmd/Ctrl + K opens search. Cmd/Ctrl + Enter runs the active tool.</p>
      </div>
    </>
  );
}
