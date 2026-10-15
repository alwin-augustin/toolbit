import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useActiveResult, usePublishedResult } from '@/shared/result-store';
import { activeSaveableResult } from '@/shared/workbench-actions';
import { useWorkspace } from '@/shared/workspace-store';
import { defaultDocState } from '@/features/tools/specs';

/** Stands in for a bespoke screen that has a result to save. */
function Publisher({ text, ext = 'txt' }: { text: string; ext?: string }) {
  usePublishedResult(text, 'Result', ext);
  return <span data-testid="published">{useActiveResult((s) => s.text)}</span>;
}

function bindDocument(toolId: string, payload: Record<string, unknown> = {}) {
  return useWorkspace.getState().openDocument(toolId, {
    ...defaultDocState(toolId),
    ...payload,
  });
}

beforeEach(() => {
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  useActiveResult.getState().clear();
});

describe('usePublishedResult', () => {
  it('publishes the text, label, and extension a save would use', () => {
    render(<Publisher text="decoded" ext="json" />);
    expect(useActiveResult.getState()).toMatchObject({ text: 'decoded', ext: 'json' });
  });

  it('withdraws the slot while there is nothing to save', () => {
    const { rerender } = render(<Publisher text="decoded" ext="json" />);
    rerender(<Publisher text="   " ext="json" />);
    expect(useActiveResult.getState().text).toBe('');
    expect(screen.getByTestId('published')).toHaveTextContent('');
  });

  it('withdraws the slot when the screen unmounts', () => {
    const { unmount } = render(<Publisher text="decoded" />);
    unmount();
    expect(useActiveResult.getState()).toMatchObject({ text: '', label: '', ext: 'txt' });
  });
});

describe('activeSaveableResult', () => {
  it('saves the bound workbench document output', () => {
    bindDocument('json-formatter', { output: '{\n  "a": 1\n}' });
    expect(activeSaveableResult()).toEqual({ text: '{\n  "a": 1\n}', ext: 'json' });
  });

  it('saves nothing for a workbench document that has not run yet', () => {
    bindDocument('json-formatter', { output: '' });
    expect(activeSaveableResult()).toBeNull();
  });

  it('prefers the document over a stale published result', () => {
    bindDocument('json-formatter', { output: 'doc' });
    useActiveResult.getState().publish('stale', 'Result', 'txt');
    expect(activeSaveableResult()).toEqual({ text: 'doc', ext: 'json' });
  });

  it('saves the result a bespoke screen published', () => {
    bindDocument('hash-generator');
    useActiveResult.getState().publish('abc123', 'Hash result', 'txt');
    expect(activeSaveableResult()).toEqual({ text: 'abc123', ext: 'txt' });
  });

  it('saves nothing when no document is open and nothing is published', () => {
    expect(activeSaveableResult()).toBeNull();
  });
});
