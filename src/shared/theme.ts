import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Single source of truth for the UI theme.
 *
 * `localStorage['theme']` is the seam both sides share: public/theme-init.js
 * reads it before the bundle loads (no flash), and this module owns every
 * read/write afterwards. An unset key means `system`. The preferences store
 * deliberately does not duplicate it — two writers would disagree across
 * the pre-paint boundary.
 */
export function systemIsDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(DARK_QUERY).matches
  );
}

export function getTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage denied: fall through to system */
  }
  return 'system';
}

/** Resolved theme actually applied to the document. Exported for tests. */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return systemIsDark() ? 'dark' : 'light';
  return theme;
}

export function applyTheme(theme: Theme = getTheme()): 'light' | 'dark' {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  root.style.colorScheme = resolved;
  return resolved;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function setTheme(theme: Theme): void {
  try {
    if (theme === 'system') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* session only: still apply for this visit */
  }
  applyTheme(theme);
  emit();
}

function getSnapshot(): Theme {
  return getTheme();
}

/** React binding for the current theme choice (`light` | `dark` | `system`). */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'system' as Theme);
}

/** Resolved `light`/`dark` for components that branch on the applied theme. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useTheme();
  return resolveTheme(theme);
}

/** Re-apply when the OS scheme changes while following the system. */
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (getTheme() === 'system') {
      applyTheme('system');
      emit();
    }
  });
}
