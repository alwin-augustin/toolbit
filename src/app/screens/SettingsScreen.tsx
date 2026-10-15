import { useState } from 'react';
import { useLocation } from 'wouter';
import { isDesktopHost } from '@/platform/desktop';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePreferences } from '@/core/preferences';
import { useSemanticEnabled } from '@/core/intent/use-semantic';
import { clearAllHistory, pruneExpiredHistory } from '@/core/history-db';
import { setTheme, useTheme, type Theme } from '@/shared/theme';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Kbd } from '@/components/ui/kbd';

const THEMES: Array<{ id: Theme; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['⌘', 'K'], label: 'Search tools and actions' },
  { keys: ['⌘', 'Enter'], label: 'Run the active tool action' },
  { keys: ['⌘', 'S'], label: 'Save session or result' },
  { keys: ['⌘', 'B'], label: 'Show or hide the navigator' },
  { keys: ['⌘', '1…9'], label: 'Jump to an open document' },
  { keys: ['⌥', 'W'], label: 'Close the current document' },
  { keys: ['/'], label: 'Focus search' },
];

/**
 * Settings.
 *
 * Grouped by what the setting is about — appearance, the workspace, and the
 * data story — because the last group is the one users come here to verify.
 */
export function SettingsScreen() {
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const setWrap = useWorkbenchMemory((s) => s.setWrap);
  const remember = useWorkbenchMemory((s) => s.remember);
  const setRemember = useWorkbenchMemory((s) => s.setRemember);
  const theme = useTheme();
  const analytics = usePreferences((s) => s.analytics);
  const history = usePreferences((s) => s.history);
  const retentionDays = usePreferences((s) => s.retentionDays);
  const semanticSearch = usePreferences((s) => s.semanticSearch);
  const { status: semanticStatus } = useSemanticEnabled();
  const desktop = isDesktopHost();
  const [, navigate] = useLocation();
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
    <div className="flex flex-col gap-5 pb-10">
      <header className="wb-page-heading">
        <h1>Settings</h1>
        <p>Choose how your workspace behaves.</p>
      </header>

      {/* Appearance */}
      <section className="wb-card" aria-labelledby="wb-set-appearance">
        <div className="wb-card-head">
          <h2 id="wb-set-appearance">Appearance</h2>
        </div>
        <div className="wb-setting-row" role="group" aria-label="Theme">
          <span>
            <strong>Theme</strong>
            <small>
              Follows your system appearance until you pick one. Saved on this device only.
            </small>
          </span>
          <div className="flex items-center gap-1">
            {THEMES.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={theme === option.id ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={theme === option.id}
                className={theme === option.id ? 'text-ink' : 'text-ink-muted'}
                onClick={() => setTheme(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <Label className="wb-setting-row cursor-pointer">
          <span>
            <strong>Wrap long lines</strong>
            <small>Keep code readable without horizontal scrolling.</small>
          </span>
          <Checkbox checked={wrap} onCheckedChange={(checked) => setWrap(Boolean(checked))} />
        </Label>
      </section>

      {/* Search */}
      <section className="wb-card" aria-labelledby="wb-set-search">
        <div className="wb-card-head">
          <h2 id="wb-set-search">Search</h2>
        </div>
        <Label className="wb-setting-row cursor-pointer">
          <span>
            <strong>Smarter search</strong>
            <small>
              Matches tasks by meaning — “make json readable” finds the JSON formatter — with a
              small on-device model (~25 MB, downloaded once). Search never waits for it.
            </small>
          </span>
          <Checkbox
            checked={semanticSearch}
            onCheckedChange={(checked) => update({ semanticSearch: Boolean(checked) })}
          />
        </Label>
        {semanticSearch && semanticStatus === 'loading' && (
          <p className="border-t border-line px-3 py-2 text-xs text-ink-muted" role="status">
            Downloading the on-device model. Keyword search works meanwhile.
          </p>
        )}
        {semanticSearch && semanticStatus === 'ready' && (
          <p className="border-t border-line px-3 py-2 text-xs text-ink-muted" role="status">
            On-device model ready.
          </p>
        )}
        {semanticSearch && semanticStatus === 'failed' && (
          <p className="border-t border-line px-3 py-2 text-xs text-ink-muted" role="status">
            The model could not load. Keyword search still works.
          </p>
        )}
      </section>

      {/* Session */}
      <section className="wb-card" aria-labelledby="wb-set-session">
        <div className="wb-card-head">
          <h2 id="wb-set-session">This session</h2>
        </div>
        <Label className="wb-setting-row cursor-pointer">
          <span>
            <strong>Remember runs in this session</strong>
            <small>Optional history. Nothing is kept after refreshing.</small>
          </span>
          <Checkbox
            checked={remember}
            onCheckedChange={(checked) => setRemember(Boolean(checked))}
          />
        </Label>
        <div className="wb-setting-row">
          <span>
            <strong>Retention: {retentionDays} days</strong>
            <small>1 to 365 days. Expired entries are removed when you ask.</small>
          </span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              aria-label="Retention days"
              min={1}
              max={365}
              className="w-20"
              value={retentionDays}
              onChange={(event) =>
                update({
                  retentionDays: Math.max(1, Math.min(365, Number(event.target.value) || 30)),
                })
              }
            />
            <Button type="button" variant="outline" size="sm" onClick={() => void applyRetention()}>
              Apply
            </Button>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="wb-card" aria-labelledby="wb-set-privacy">
        <div className="wb-card-head">
          <h2 id="wb-set-privacy">Privacy and data</h2>
        </div>
        {/* The installed app ships without analytics, so the switch is shown
            only where it can actually do something. */}
        {desktop ? null : (
          <Label className="wb-setting-row cursor-pointer">
            <span>
              <strong>Product analytics</strong>
              <small>
                Pseudonymous usage and error events. Tool input and output are never sent.
              </small>
            </span>
            <Checkbox
              checked={analytics}
              onCheckedChange={(checked) => update({ analytics: Boolean(checked) })}
            />
          </Label>
        )}
        <Label className="wb-setting-row cursor-pointer">
          <span>
            <strong>Record history</strong>
            <small>Secret tools never record. Applies from now on.</small>
          </span>
          <Checkbox
            checked={history}
            onCheckedChange={(checked) => update({ history: Boolean(checked) })}
          />
        </Label>
        <div className="wb-setting-row">
          <span>
            <strong>Stored history</strong>
            <small>Clear everything this device has recorded for the workbench.</small>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void clearData()}>
            Clear stored history
          </Button>
        </div>
        {/* Installed, the legal pages are not advertised anywhere else, so
            Settings is where they stay reachable. */}
        {desktop && (
          <div className="wb-setting-row">
            <span>
              <strong>Privacy policy and terms</strong>
              <small>The installed app keeps the same promises as the site.</small>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/privacy')}
              >
                Privacy
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/terms')}>
                Terms
              </Button>
            </div>
          </div>
        )}
        {status ? (
          <p className="border-t border-line px-3 py-2 text-xs text-ink-muted" role="status">
            {status}
          </p>
        ) : null}
      </section>

      {/* Shortcuts */}
      <section className="wb-card" aria-labelledby="wb-set-shortcuts">
        <div className="wb-card-head">
          <h2 id="wb-set-shortcuts">Keyboard</h2>
        </div>
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.label} className="wb-setting-row">
            <span>
              <strong>{shortcut.label}</strong>
            </span>
            <span className="flex items-center gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
          </div>
        ))}
      </section>

      <div className="wb-settings-info">
        <h2>Data stays on this device</h2>
        <p>
          Local transformations run in your browser and nowhere else. Tab structure is saved on this
          device without its contents. Session runs are remembered only when you ask. Stored history
          and retention follow the switches above. Analytics sends anonymous usage events — never
          tool input or output — and the switch above turns it off. The API Request Builder and
          WebSocket Tester contact only the endpoints you explicitly run.
        </p>
      </div>
    </div>
  );
}
