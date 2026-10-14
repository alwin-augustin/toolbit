import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// jsdom has no layout, so scrolling the document strip into view must be a no-op.
Element.prototype.scrollIntoView = () => {};

// jsdom ships no matchMedia. The shell's panel breakpoint and the install
// prompt both branch on it, so without a stub those paths throw in tests and
// the pages that use them never render. `matches: false` is the wide viewport.
// Writable, because tests that care about the breakpoint replace it per case.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
});
vi.mock('@/shared/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    readOnly,
    placeholder,
    label,
  }: {
    value: string;
    onChange?: (v: string) => void;
    readOnly?: boolean;
    placeholder?: string;
    label?: string;
  }) =>
    createElement('textarea', {
      value,
      readOnly,
      placeholder,
      'aria-label': label || (readOnly ? 'Output' : 'Input'),
      onChange: (event: { target: { value: string } }) => onChange?.(event.target.value),
    }),
}));
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
