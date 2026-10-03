import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentContext } from '@/shared/document-state';
import { useWorkspace } from '@/shared/workspace-store';
import { CUSTOM_SCREENS } from '@/features/tools/custom-screens';

/**
 * Phase 2 — custom-screen UI matrix. Every bespoke screen must render
 * its heading + primary controls without crashing (jsdom + mocked CodeEditor).
 * Deep behavior stays in workbench-custom-*.test.ts (helpers) + e2e sweep.
 */
describe('custom screens matrix (29 components)', () => {
  beforeEach(() => {
    useWorkspace.setState({ tabs: [], activeTabId: null });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  for (const [id, Component] of Object.entries(CUSTOM_SCREENS)) {
    it(`${id}: renders heading and primary controls`, async () => {
      // Open a backing document so document hooks have an id, like the router does.
      const docId = useWorkspace.getState().openDocument(id);
      render(
        <DocumentContext.Provider value={docId ?? null}>
          <Suspense fallback={<p>Loading {id}…</p>}>
            <Component />
          </Suspense>
        </DocumentContext.Provider>,
      );
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
      // Every screen exposes at least one button (sample/run/convert/generate/filter).
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  }

  it('hash: load sample produces digests and copy is enabled', async () => {
    const user = userEvent.setup();
    const { HashScreen } = await import('@/features/tools/hash-generator/HashScreen');
    const docId = useWorkspace.getState().openDocument('hash-generator');
    render(
      <DocumentContext.Provider value={docId ?? null}>
        <HashScreen />
      </DocumentContext.Provider>,
    );
    await user.click(screen.getByRole('button', { name: /Load sample/ }));
    await screen.findByText(/4 digests/, undefined, { timeout: 3000 });
    expect(screen.getByRole('button', { name: /Copy all/ })).toBeEnabled();
  });

  it('jwt: invalid token shows alert and preserves honesty', async () => {
    const user = userEvent.setup();
    const { JwtScreen } = await import('@/features/tools/jwt-decoder/JwtScreen');
    const docId = useWorkspace.getState().openDocument('jwt-decoder');
    render(
      <DocumentContext.Provider value={docId ?? null}>
        <JwtScreen />
      </DocumentContext.Provider>,
    );
    const input = screen.getByRole('textbox', { name: /JWT/i });
    await user.clear(input);
    await user.type(input, 'onlyone');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
