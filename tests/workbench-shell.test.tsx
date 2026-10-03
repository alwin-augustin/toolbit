import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceScreen } from '@/app/screens/WorkspaceScreen';
import { useWorkspace } from '@/shared/workspace-store';
import { defaultDocState } from '@/features/tools/specs';
import { INVOICE_SAMPLE } from '@/shared/workbench';

function openDoc(toolId: 'json-formatter' | 'timestamp-converter', input?: string): string {
  const id = useWorkspace.getState().openDocument(toolId, {
    ...defaultDocState(toolId, input),
    label: toolId,
  });
  if (!id) throw new Error(`could not open ${toolId}`);
  return id;
}

/** Mirrors the router: subscribes to the store so the screen gets fresh tabs. */
function Harness({ id }: { id: string }) {
  const tab = useWorkspace((s) => s.tabs.find((t) => t.id === id));
  if (!tab) throw new Error('missing doc');
  return <WorkspaceScreen tab={tab} />;
}

describe('workbench workspace (design-QA journeys)', () => {
  it('shows the preformatted invoice sample with copy enabled', () => {
    render(<Harness id={openDoc('json-formatter')} />);
    const result = screen.getByRole('textbox', { name: 'Result code' });
    expect((result as HTMLTextAreaElement).value).toBe(
      JSON.stringify(JSON.parse(INVOICE_SAMPLE), null, 2),
    );
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeEnabled();
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });

  it('minifies to a single line', async () => {
    const user = userEvent.setup();
    render(<Harness id={openDoc('json-formatter')} />);
    await user.click(screen.getByRole('button', { name: 'Minify' }));
    const result = screen.getByRole('textbox', { name: 'Result code' });
    expect((result as HTMLTextAreaElement).value).toBe(INVOICE_SAMPLE);
  });

  it('keeps the prior output, explains the error, and disables copy on invalid JSON', async () => {
    const user = userEvent.setup();
    render(<Harness id={openDoc('json-formatter')} />);
    const before = (screen.getByRole('textbox', { name: 'Result code' }) as HTMLTextAreaElement)
      .value;

    fireEvent.change(screen.getByRole('textbox', { name: 'Input code' }), {
      target: { value: '{"a":1,' },
    });
    await user.click(screen.getByRole('button', { name: 'Format' }));

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/line 1, column 8/);
    expect(
      (screen.getByRole('textbox', { name: 'Result code' }) as HTMLTextAreaElement).value,
    ).toBe(before);
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeDisabled();
    expect(screen.getByText('Needs attention')).toBeInTheDocument();
  });

  it('converts a timestamp to UTC and Unix lines', async () => {
    const user = userEvent.setup();
    render(<Harness id={openDoc('timestamp-converter', '1790942400')} />);
    await user.click(screen.getByRole('button', { name: 'Convert' }));
    const result = screen.getByRole('textbox', { name: 'Result code' });
    expect((result as HTMLTextAreaElement).value).toContain('UTC: 2026-10-02T12:00:00.000Z');
  });
});
