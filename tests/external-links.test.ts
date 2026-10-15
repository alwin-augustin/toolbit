import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installExternalLinkGuard, isExternalUrl } from '@/platform/external-links';

const ORIGIN = 'http://localhost:3000/json-formatter';

/** The shape `isDesktopHost` recognises: `core` and `event` both present. */
function installShellStub() {
  Object.defineProperty(window, '__TAURI__', {
    configurable: true,
    value: { core: { invoke: vi.fn() }, event: { listen: vi.fn() } },
  });
}

function removeShellStub() {
  delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

/** Dispatch a real click at an anchor and report whether it was cancelled. */
function clickAnchor(href: string): boolean {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = 'link';
  document.body.appendChild(link);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  link.remove();
  return event.defaultPrevented;
}

beforeEach(() => {
  window.history.replaceState(null, '', '/json-formatter');
});

afterEach(() => {
  removeShellStub();
});

describe('external link policy', () => {
  it('separates addresses that leave the app from addresses inside it', () => {
    expect(isExternalUrl('/library', ORIGIN)).toBe(false);
    expect(isExternalUrl('#section', ORIGIN)).toBe(false);
    expect(isExternalUrl('http://localhost:3000/saved', ORIGIN)).toBe(false);
    expect(isExternalUrl('mailto:dev@toolbit.app', ORIGIN)).toBe(false);
    expect(isExternalUrl('https://example.com/docs', ORIGIN)).toBe(true);
    expect(isExternalUrl('//example.com/docs', ORIGIN)).toBe(true);
    expect(isExternalUrl('not a url', ORIGIN)).toBe(false);
  });

  it('leaves the browser alone', () => {
    const uninstall = installExternalLinkGuard(vi.fn());

    expect(clickAnchor('https://example.com/docs')).toBe(false);

    uninstall();
  });

  it('copies an external link instead of letting it replace the installed app', async () => {
    installShellStub();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const notify = vi.fn();
    const uninstall = installExternalLinkGuard(notify);

    expect(clickAnchor('https://example.com/docs')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.com/docs');
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith(expect.stringMatching(/copied/i));
    });

    // A link back into the workspace is not the guard's business.
    expect(clickAnchor('/library')).toBe(false);
    expect(writeText).toHaveBeenCalledTimes(1);

    uninstall();
    expect(clickAnchor('https://example.com/again')).toBe(false);
  });

  it('still tells the user where the link went when the clipboard is denied', () => {
    installShellStub();
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const notify = vi.fn();
    installExternalLinkGuard(notify);

    clickAnchor('https://example.com/docs');

    return vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith(expect.stringContaining('https://example.com/docs'));
    });
  });
});
