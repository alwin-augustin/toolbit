import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceScreen } from '@/app/screens/WorkspaceScreen';
import { useWorkspace } from '@/shared/workspace-store';
import { ALL_SPECS, defaultDocState } from '@/features/tools/specs';

function openDoc(toolId: string, input?: string): string {
  useWorkspace.setState({ tabs: [], activeTabId: null });
  const id = useWorkspace.getState().openDocument(toolId, {
    ...defaultDocState(toolId, input),
    label: toolId,
  });
  if (!id) throw new Error(`could not open ${toolId}`);
  return id;
}

function Harness({ id }: { id: string }) {
  const tab = useWorkspace((s) => s.tabs.find((t) => t.id === id));
  if (!tab) throw new Error('missing doc');
  return <WorkspaceScreen tab={tab} />;
}

const HAPPY_INPUT: Record<string, string> = {
  'json-formatter': '{"b":2,"a":1}',
  'base64-encoder': 'hello',
  'timestamp-converter': '1790942400',
  'url-encoder': 'hello%20world',
  'yaml-formatter': 'a: 1\n',
  'csv-to-json': 'name,age\nann,30',
  'sql-formatter': 'select id from users where active = 1;',
  'css-formatter': 'body{margin:0}',
  'graphql-formatter': '{ user { name } }',
  'js-json-minifier': 'function add(a, b) {\n  return a + b;\n}',
  'html-escape': '<p>&</p>',
  'strip-whitespace': '  hello   world  ',
};

describe('generic workbench matrix (12 workbench tools)', () => {
  beforeEach(() => {
    useWorkspace.setState({ tabs: [], activeTabId: null });
  });

  for (const [id, spec] of Object.entries(ALL_SPECS)) {
    it(`${id}: pure run happy + empty contract`, async () => {
      const happy = await spec.run(
        HAPPY_INPUT[id] ?? 'hello',
        { ...spec.defaults },
        spec.defaultMode,
      );
      expect(happy.error, `${id} happy`).toBe('');
      expect(happy.output, `${id} happy output`).not.toBe('');
      const empty = await spec.run('   ', { ...spec.defaults }, spec.defaultMode);
      expect(empty.output).toBe('');
      expect(empty.error).toBeTruthy();
    });

    it(`${id}: renders chrome, runs, copies, clears, errors honestly`, async () => {
      const user = userEvent.setup();
      render(<Harness id={openDoc(id, HAPPY_INPUT[id] ?? 'hello')} />);
      expect(screen.getByRole('heading', { level: 1, name: spec.title })).toBeInTheDocument();

      // Run happy path through the real UI chrome
      const primaryLabel = spec.actions[0]?.label ?? 'Format';
      await user.click(screen.getByRole('button', { name: primaryLabel }));
      const result = screen.getByRole('textbox', { name: 'Result code' });
      expect((result as HTMLTextAreaElement).value).not.toBe('');

      // Invalid input (where the tool has failure modes) keeps prior output + disables copy.
      // JSON-family tools have deterministic failures; others at least keep chrome functional.
      if (['json-formatter', 'yaml-formatter', 'graphql-formatter'].includes(id)) {
        const before = (result as HTMLTextAreaElement).value;
        fireEvent.change(screen.getByRole('textbox', { name: 'Input code' }), {
          target: {
            value:
              id === 'yaml-formatter' ? '{bad' : id === 'graphql-formatter' ? '{ bad' : '{"a":1,',
          },
        });
        await user.click(screen.getByRole('button', { name: primaryLabel }));
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(
          (screen.getByRole('textbox', { name: 'Result code' }) as HTMLTextAreaElement).value,
        ).toBe(before);
        expect(screen.getByRole('button', { name: 'Copy result' })).toBeDisabled();
      }

      // Clear resets input
      await user.click(screen.getByRole('button', { name: 'Clear' }));
      expect(
        (screen.getByRole('textbox', { name: 'Input code' }) as HTMLTextAreaElement).value,
      ).toBe('');
    });
  }

  it('exposes copy/download chrome on a representative tool', async () => {
    const user = userEvent.setup();
    render(<Harness id={openDoc('json-formatter', '{"a":1}')} />);
    await user.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'More result actions' }));
    expect(screen.getByRole('button', { name: /Download result/ })).toBeInTheDocument();
  });
});
