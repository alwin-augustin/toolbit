import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTheme, resolveTheme, applyTheme, setTheme, systemIsDark } from '@/shared/theme';

type Listener = (event: { matches: boolean; media: string }) => void;

let darkMatches = false;
const listeners = new Set<Listener>();

function installMatchMedia(): void {
  darkMatches = false;
  listeners.clear();
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: query.includes('dark') ? darkMatches : false,
      media: query,
      addEventListener: (_type: string, fn: Listener) => {
        listeners.add(fn);
      },
      removeEventListener: (_type: string, fn: Listener) => {
        listeners.delete(fn);
      },
      addListener: (fn: Listener) => {
        listeners.add(fn);
      },
      removeListener: (fn: Listener) => {
        listeners.delete(fn);
      },
      dispatchEvent: () => false,
    }),
    configurable: true,
  });
}

function setOsScheme(dark: boolean): void {
  darkMatches = dark;
  for (const fn of [...listeners]) fn({ matches: dark, media: '(prefers-color-scheme: dark)' });
}

function resetDocumentTheme(): void {
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.style.colorScheme = '';
}

describe('theme resolution', () => {
  beforeEach(() => {
    installMatchMedia();
    resetDocumentTheme();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetDocumentTheme();
  });

  it('returns the stored choice and system for unset or invalid values', () => {
    expect(getTheme()).toBe('system');
    window.localStorage.setItem('theme', 'dark');
    expect(getTheme()).toBe('dark');
    window.localStorage.setItem('theme', 'light');
    expect(getTheme()).toBe('light');
    window.localStorage.setItem('theme', 'sepia');
    expect(getTheme()).toBe('system');
  });

  it('resolves system from the OS scheme and passes explicit choices through', () => {
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('system')).toBe('light');
    setOsScheme(true);
    expect(resolveTheme('system')).toBe('dark');
    expect(systemIsDark()).toBe(true);
  });

  it('applies classes and color-scheme for the resolved theme', () => {
    expect(applyTheme('dark')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(applyTheme('light')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists explicit choices and clears the key for system', () => {
    setTheme('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
    expect(getTheme()).toBe('dark');
    setTheme('system');
    expect(window.localStorage.getItem('theme')).toBeNull();
    expect(getTheme()).toBe('system');
  });

  it('re-applies when the OS scheme changes while following the system', async () => {
    vi.resetModules();
    installMatchMedia();
    const fresh = await import('@/shared/theme');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fresh.applyTheme('system');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    setOsScheme(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('ignores OS changes once an explicit choice is stored', async () => {
    vi.resetModules();
    installMatchMedia();
    const fresh = await import('@/shared/theme');
    fresh.setTheme('light');
    setOsScheme(true);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
