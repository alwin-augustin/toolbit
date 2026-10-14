import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { AppRouter } from '@/app/router';
import { WorkspaceShell } from '@/app/shell/WorkspaceShell';
import { OfflineIndicator } from '@/app/components/OfflineIndicator';
import { useWorkspace } from '@/shared/workspace-store';
import { usePreferences } from '@/core/preferences';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { defaultDocState } from '@/features/tools/specs';
import { applyTheme } from '@/shared/theme';

const PANEL_KEY = 'toolbit:panel';

/** jsdom ships no matchMedia; the shell asks it about the desktop breakpoint. */
function stubMatchMedia(desktop: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: desktop && query.includes('min-width'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function renderShell(path = '/') {
  window.history.replaceState(null, '', path);
  return render(
    <Router>
      <WorkspaceShell>
        <AppRouter />
      </WorkspaceShell>
    </Router>,
  );
}

function panelState() {
  return document.querySelector('.wb-shell')?.getAttribute('data-panel');
}

function drawerState() {
  return document.querySelector('.wb-shell')?.getAttribute('data-drawer');
}

function openDoc(toolId: string, label: string, input?: string): string {
  let id: string | null = null;
  act(() => {
    id = useWorkspace.getState().openDocument(toolId, {
      ...defaultDocState(toolId, input),
      label,
    });
  });
  if (!id) throw new Error(`could not open ${toolId}`);
  return id;
}

function rail() {
  return within(screen.getByRole('navigation', { name: 'Primary' }));
}

function press(target: Window | Element, key: string, init: Record<string, unknown> = {}) {
  fireEvent.keyDown(target, { key, ...init });
}

beforeEach(() => {
  stubMatchMedia(true);
  applyTheme('light');
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  useWorkbenchMemory.setState({ toast: '', remember: false });
});

describe('navigator shell', () => {
  it('carries the four destinations, settings, search and the local-only assurance', () => {
    renderShell('/');

    expect(rail().getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(rail().getByRole('button', { name: 'Tools' })).toBeInTheDocument();
    expect(rail().getByRole('button', { name: 'Saved' })).toBeInTheDocument();
    expect(rail().getByRole('button', { name: 'History' })).toBeInTheDocument();
    expect(rail().getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search tools or actions...' })).toBeInTheDocument();
    expect(screen.getAllByText('Local only').length).toBeGreaterThan(0);
  });

  it('moves between workspace screens from the rail', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.click(rail().getByRole('button', { name: 'Tools' }));
    expect(window.location.pathname).toBe('/library');
    expect(await screen.findByRole('heading', { name: 'All Tools' })).toBeInTheDocument();

    await user.click(rail().getByRole('button', { name: 'History' }));
    expect(window.location.pathname).toBe('/history');
    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();

    await user.click(rail().getByRole('button', { name: 'Home' }));
    expect(window.location.pathname).toBe('/');
    expect(await screen.findByRole('heading', { name: 'Start' })).toBeInTheDocument();
  });

  it('collapses the navigator with ⌘B and remembers the preference', () => {
    renderShell('/');
    expect(panelState()).toBe('open');

    act(() => press(window, 'b', { metaKey: true }));
    expect(panelState()).toBe('collapsed');
    expect(window.localStorage.getItem(PANEL_KEY)).toBe('collapsed');

    act(() => press(window, 'b', { metaKey: true }));
    expect(panelState()).toBe('open');
    expect(window.localStorage.getItem(PANEL_KEY)).toBe('open');
  });

  it('restores a collapsed navigator when its own destination is activated again', async () => {
    const user = userEvent.setup();
    renderShell('/library');

    act(() => press(window, 'b', { metaKey: true }));
    expect(panelState()).toBe('collapsed');

    await user.click(rail().getByRole('button', { name: 'Tools' }));

    expect(panelState()).toBe('open');
    expect(window.localStorage.getItem(PANEL_KEY)).toBe('open');
  });

  it('opens search from ⌘K and from /, and closes it on Escape', async () => {
    const user = userEvent.setup();
    renderShell('/');

    act(() => press(window, 'k', { metaKey: true }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => press(window, 'Escape'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => press(window, '/'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not fire a bare-key shortcut while the user is typing', () => {
    renderShell('/');
    const field = screen.getByRole('textbox', { name: 'Paste data to find a tool' });

    fireEvent.keyDown(field, { key: '/' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the navigator as a drawer when the viewport is narrow', async () => {
    const user = userEvent.setup();
    stubMatchMedia(false);
    renderShell('/');

    expect(drawerState()).toBe('closed');

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(drawerState()).toBe('open');

    await user.click(screen.getByRole('button', { name: 'Close navigator' }));
    expect(drawerState()).toBe('closed');
  });
});

describe('document strip', () => {
  it('jumps to the document at that position with ⌘1', async () => {
    renderShell('/');
    const first = openDoc('json-formatter', 'JSON Formatter');
    const second = openDoc('strip-whitespace', 'Strip Whitespace');
    expect(useWorkspace.getState().activeTabId).toBe(second);

    act(() => press(window, '1', { metaKey: true }));
    expect(useWorkspace.getState().activeTabId).toBe(first);
    expect(await screen.findByText(/Valid JSON/)).toBeInTheDocument();

    // ⌘4 addresses a document that does not exist: nothing moves.
    act(() => press(window, '4', { metaKey: true }));
    expect(useWorkspace.getState().activeTabId).toBe(first);
  });

  it('closes the active document with ⌥W and leaves the workspace on the last one', () => {
    renderShell('/');
    const first = openDoc('json-formatter', 'JSON Formatter');
    openDoc('strip-whitespace', 'Strip Whitespace');

    act(() => press(window, 'w', { altKey: true }));
    expect(useWorkspace.getState().tabs.map((t) => t.id)).toEqual([first]);
    expect(window.location.pathname).toBe('/');

    // Closing the last document returns to the start screen rather than
    // leaving an empty strip behind.
    act(() => press(window, 'w', { altKey: true }));
    expect(useWorkspace.getState().tabs).toHaveLength(0);
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { name: 'Start' })).toBeInTheDocument();
  });

  it('activates a document, steps with the arrow keys, and closes one', async () => {
    const user = userEvent.setup();
    renderShell('/');

    // Custom screens hold no document, so the route never reopens a closed tab
    // behind these assertions.
    const first = openDoc('hash-generator', 'Hash Generator');
    const second = openDoc('jwt-decoder', 'JWT Decoder');
    const third = openDoc('uuid-generator', 'UUID Generator');

    const tab = (id: string) => document.querySelector<HTMLElement>(`[data-tab-id="${id}"]`)!;
    expect(document.querySelectorAll('[data-tab-id]')).toHaveLength(3);

    await user.click(within(tab(second)).getByText('JWT Decoder'));
    expect(useWorkspace.getState().activeTabId).toBe(second);

    fireEvent.keyDown(tab(second), { key: 'ArrowRight' });
    expect(useWorkspace.getState().activeTabId).toBe(third);

    fireEvent.keyDown(tab(third), { key: 'ArrowLeft' });
    expect(useWorkspace.getState().activeTabId).toBe(second);

    // The strip ignores keys that are not steps through the document order.
    fireEvent.keyDown(tab(second), { key: 'a' });
    expect(useWorkspace.getState().activeTabId).toBe(second);

    // Middle-click closes the tab it lands on, the way a browser document does.
    fireEvent(tab(first), new MouseEvent('auxclick', { bubbles: true, button: 1 }));
    expect(useWorkspace.getState().tabs.map((t) => t.id)).toEqual([second, third]);

    await user.click(within(tab(second)).getByRole('button', { name: 'Close JWT Decoder' }));
    expect(useWorkspace.getState().tabs.map((t) => t.id)).toEqual([third]);
  });

  it('hides the strip entirely when nothing is open', () => {
    renderShell('/');

    expect(document.querySelector('[data-tab-id]')).toBeNull();
    expect(screen.queryByLabelText('Open documents')).not.toBeInTheDocument();
  });
});

describe('shell feedback', () => {
  it('announces a notification and clears it after a few seconds', () => {
    vi.useFakeTimers();
    try {
      renderShell('/');
      const region = document.querySelector('.wb-toast')!;

      act(() => useWorkbenchMemory.getState().notify('Fixture copied'));
      expect(region.textContent).toContain('Fixture copied');
      expect(region.className).toContain('visible');

      act(() => vi.advanceTimersByTime(3100));
      expect(region.textContent).toBe('');
      expect(region.className).not.toContain('visible');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports going offline and back online', () => {
    render(<OfflineIndicator />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent("You're offline");

    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('settings screen', () => {
  it('applies and persists a theme choice, and lists the shortcuts', async () => {
    const user = userEvent.setup();
    renderShell('/settings');

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'System' }));
    expect(window.localStorage.getItem('theme')).toBeNull();

    expect(screen.getByText('Show or hide the navigator')).toBeInTheDocument();
    expect(screen.getByText('Data stays on this device')).toBeInTheDocument();
  });

  it('clamps the retention days setting to a usable range', async () => {
    const user = userEvent.setup();
    renderShell('/settings');
    const field = await screen.findByRole('spinbutton', { name: 'Retention days' });
    expect((field as HTMLInputElement).value).toBe('30');

    await user.clear(field);
    await user.type(field, '900');
    expect((field as HTMLInputElement).value).toBe('365');
  });
});

describe('context strip controls', () => {
  it('gives the navigator one control at a time, beside the panel it controls', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PANEL_KEY, 'open');
    renderShell('/');
    // The shell's context strip. A screen's own `<header>` is also a banner, so
    // the strip is addressed by its class.
    const topbar = document.querySelector('.wb-topbar') as HTMLElement;

    // Open: the panel's own header collapses it, and nothing on the far right
    // of the topbar duplicates the job.
    expect(within(topbar).queryByRole('button', { name: /navigator/i })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Collapse navigator' }));
    expect(panelState()).toBe('collapsed');

    // Collapsed: one control comes back, ahead of the breadcrumb on the left.
    const reveal = screen.getByRole('button', { name: 'Show navigator' });
    expect(within(topbar).queryByRole('button', { name: 'Collapse navigator' })).toBeNull();
    const breadcrumb = within(topbar).getByRole('navigation', { name: 'Breadcrumb' });
    expect(reveal.compareDocumentPosition(breadcrumb) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await user.click(reveal);
    expect(panelState()).toBe('open');
  });

  it('switches product analytics consent from the topbar', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ analytics: true });
    renderShell('/');

    const on = screen.getByRole('button', { name: /Product analytics is on/ });
    expect(on).toHaveAttribute('aria-pressed', 'true');

    await user.click(on);

    expect(usePreferences.getState().analytics).toBe(false);
    expect(screen.getByRole('button', { name: /Product analytics is off/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(useWorkbenchMemory.getState().toast).toMatch(/Analytics off/);

    usePreferences.setState({ analytics: true });
  });
});
