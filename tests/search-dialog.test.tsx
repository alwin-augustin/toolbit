import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { AppRouter } from '@/app/router';
import { WorkspaceShell } from '@/app/shell/WorkspaceShell';
import { useWorkspace } from '@/shared/workspace-store';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { applyTheme } from '@/shared/theme';
import { track } from '@/core/telemetry';

// The palette reports discovery events through `track`; mocking keeps the
// assertions on the event shape without exercising the analytics client.
vi.mock('@/core/telemetry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/telemetry')>();
  return { ...actual, track: vi.fn() };
});

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

function press(target: Window | Element, key: string, init: Record<string, unknown> = {}) {
  fireEvent.keyDown(target, { key, ...init });
}

function openPalette() {
  act(() => press(window, 'k', { metaKey: true }));
  return screen.getByRole('textbox', { name: 'Search tools' });
}

function paletteResults() {
  return within(screen.getByRole('dialog')).getAllByRole('button');
}

beforeEach(() => {
  stubMatchMedia(true);
  applyTheme('light');
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  useWorkbenchMemory.setState({ toast: '', remember: false });
  vi.clearAllMocks();
});

describe('command palette intent search', () => {
  it('ranks the tool that fits the task first and shows the reason', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.type(openPalette(), 'make json readable');

    const [first] = paletteResults();
    expect(first).toHaveTextContent('JSON Formatter');
    expect(first).toHaveTextContent('For “make json readable”');
  });

  it('opens the top match with Enter and reports the acceptance', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.type(openPalette(), 'make json readable');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(window.location.pathname).toBe('/json-formatter'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useWorkspace.getState().tabs.some((tab) => tab.toolId === 'json-formatter')).toBe(true);
    expect(track).toHaveBeenCalledWith('discovery_suggestion_accepted', {
      tool_id: 'json-formatter',
      discovery_source: 'palette',
      resolved_by: 'name',
    });
  });

  it('reports one discovery query per typed query', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.type(openPalette(), 'make json readable');

    await waitFor(
      () =>
        expect(track).toHaveBeenCalledWith('discovery_query', {
          discovery_source: 'palette',
          resolved_by: 'name',
          result_count_bucket: 'many',
        }),
      { timeout: 3000 },
    );
    expect(
      vi.mocked(track).mock.calls.filter(([event]) => event === 'discovery_query'),
    ).toHaveLength(1);
  });

  it('tolerates a typo and says which name it recognised', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.type(openPalette(), 'jsom formatter');

    const [first] = paletteResults();
    expect(first).toHaveTextContent('JSON Formatter');
    expect(first).toHaveTextContent('Close to “JSON Formatter”');
  });

  it('keeps an exact name match ahead of weaker intent matches', async () => {
    const user = userEvent.setup();
    renderShell('/');

    await user.type(openPalette(), 'uuid');

    const results = paletteResults();
    expect(results).toHaveLength(1);
    expect(results[0]).toHaveTextContent('UUID Generator');
  });
});
