import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentContext } from '@/shared/document-state';
import { useWorkspace } from '@/shared/workspace-store';
import { CUSTOM_SCREENS } from '@/features/tools/custom-screens';

/**
 * Every bespoke screen that ships a sample must be able to consume it.
 *
 * The XML prettifier shipped a depth bug that only appeared on the tool's own
 * bundled sample, which stayed invisible because each screen's sample was never
 * exercised. This sweep clicks the sample affordance on every screen, then
 * asserts two things a user would notice: no error surface appears, and the
 * screen actually changed something.
 *
 * What this catches is the loud end of that class — a sample that throws, or
 * one that silently does nothing. It cannot tell correct output from subtly
 * wrong output, so a computation's own output is pinned by that tool's helper
 * tests instead (see `prettifyXml` in the xml suite for the drift this net
 * missed when the bug was only wrong indentation).
 */

/** Names the screens use for "fill in this demo input". */
const SAMPLE_NAMES = [/load sample/i, /^sample/i, /^load example/i, /^generate/i, /^add sample/i];

/** These compute nothing until a real file or socket is supplied. */
const NEEDS_EXTERNAL_INPUT = new Set(['image-converter', 'pdf-tools']);

/**
 * These two open *on* their sample: the constructor state is the demo image and
 * the demo hex, so pressing the sample action is correctly a no-op. They still
 * take part in the sweep — the click must not raise an error — but there is no
 * change to observe.
 */
const OPENS_ON_ITS_SAMPLE = new Set(['docker-command-builder', 'color-converter']);

const covered = new Set<string>();

/**
 * What the user can see: every field value plus the page's text. Field values
 * are read separately because a controlled input's value is not its text
 * content, and the page as a whole is read because a result can be rendered
 * anywhere — a pane, a row list, a footer, or a placeholder that goes away.
 */
function snapshotText(): string {
  const fields = [...document.querySelectorAll('textarea, input')]
    .map((element) => (element as HTMLInputElement).value)
    .join('|');
  return `${fields}::${document.body.textContent ?? ''}`;
}

function sampleTrigger(): HTMLElement | undefined {
  for (const name of SAMPLE_NAMES) {
    const found = screen
      .queryAllByRole('button', { name })
      .find((button) => !(button as HTMLButtonElement).disabled);
    if (found) return found;
  }
  return undefined;
}

beforeEach(() => {
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '',
    }),
  );
});

describe('bespoke screens consume their own samples', () => {
  for (const [id, Component] of Object.entries(CUSTOM_SCREENS)) {
    if (NEEDS_EXTERNAL_INPUT.has(id)) continue;

    it(`${id}: sample computes without an error`, async () => {
      const user = userEvent.setup();
      const docId = useWorkspace.getState().openDocument(id);
      render(
        <DocumentContext.Provider value={docId ?? null}>
          <Suspense fallback={<p>Loading {id}…</p>}>
            <Component />
          </Suspense>
        </DocumentContext.Provider>,
      );
      await screen.findByRole('heading', { level: 1 });

      const trigger = sampleTrigger();
      // A screen with no sample affordance has nothing to sweep yet, and the
      // coverage assertion below is what stops that from going unnoticed.
      if (!trigger) return;

      const before = snapshotText();
      await user.click(trigger);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      // The point of a sample is that it produces something to look at; a
      // screen whose sample silently does nothing is as broken as one that
      // errors, except on the two that start from their sample already.
      if (!OPENS_ON_ITS_SAMPLE.has(id)) expect(snapshotText()).not.toBe(before);
      covered.add(id);
    });
  }

  it('sweeps the expected number of screens', () => {
    // Raise this as screens gain sample affordances; lowering it means a
    // rename silently removed a screen from the sweep.
    expect(covered.size).toBeGreaterThanOrEqual(20);
  });
});
