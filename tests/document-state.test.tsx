import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DocumentContext,
  useDocumentField,
  useDocumentOptions,
  useSessionDocumentState,
} from '@/shared/document-state';
import { useWorkspace } from '@/shared/workspace-store';
import type { JsonValue } from '@/core/tool-contract';

beforeEach(() => {
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
});

function openDoc(toolId = 'hash-generator', payload: Record<string, JsonValue> = {}) {
  return useWorkspace.getState().openDocument(toolId, payload);
}

describe('useDocumentField', () => {
  it('uses fallback state without a document', () => {
    function Probe() {
      const [value, setValue] = useDocumentField<string>('input', 'init');
      return (
        <button type="button" onClick={() => setValue('next')}>
          {value || 'empty'}
        </button>
      );
    }
    render(
      <DocumentContext.Provider value={null}>
        <Probe />
      </DocumentContext.Provider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('init');
  });

  it('reads and patches the document payload', async () => {
    const user = userEvent.setup();
    const id = openDoc('hash-generator', { input: 'stored' });
    function Probe() {
      const [value, setValue] = useDocumentField<string>('input', '');
      return (
        <>
          <span data-testid="v">{value}</span>
          <button type="button" onClick={() => setValue('patched')}>
            patch
          </button>
        </>
      );
    }
    render(
      <DocumentContext.Provider value={id}>
        <Probe />
      </DocumentContext.Provider>,
    );
    expect(screen.getByTestId('v')).toHaveTextContent('stored');
    await user.click(screen.getByRole('button', { name: 'patch' }));
    expect(useWorkspace.getState().tabs.find((t) => t.id === id)?.payload).toMatchObject({
      input: 'patched',
    });
  });

  it('falls back when the stored type mismatches', () => {
    const id = openDoc('hash-generator', { input: 42 });
    function Probe() {
      const [value] = useDocumentField<string>('input', 'fallback');
      return <span data-testid="v">{value}</span>;
    }
    render(
      <DocumentContext.Provider value={id}>
        <Probe />
      </DocumentContext.Provider>,
    );
    expect(screen.getByTestId('v')).toHaveTextContent('fallback');
  });
});

describe('useDocumentOptions', () => {
  it('merges defaults with stored options and patches them', () => {
    const id = openDoc('json-formatter', {});
    useWorkspace.getState().patchDocument(id!, { options: { indent: '4' } });
    let captured: { indent?: unknown; set?: (p: object) => void } = {};
    function Probe() {
      const opts = useDocumentOptions({ indent: '2', sortKeys: false });
      captured = opts as typeof captured;
      return null;
    }
    render(
      <DocumentContext.Provider value={id}>
        <Probe />
      </DocumentContext.Provider>,
    );
    expect(captured.indent).toBe('4');
    act(() => {
      captured.set!({ sortKeys: true });
    });
    expect(useWorkspace.getState().tabs.find((t) => t.id === id)?.options).toMatchObject({
      indent: '4',
      sortKeys: true,
    });
  });
});

describe('useSessionDocumentState', () => {
  it('keeps session values per document and mirrors serializable state', () => {
    const id = openDoc('hash-generator');
    function Probe() {
      const [value, setValue] = useSessionDocumentState('note', 'a');
      return (
        <button type="button" onClick={() => setValue('b')}>
          {value}
        </button>
      );
    }
    render(
      <DocumentContext.Provider value={id}>
        <Probe />
      </DocumentContext.Provider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('a');
    act(() => {
      screen.getByRole('button').click();
    });
    expect(useWorkspace.getState().tabs.find((t) => t.id === id)?.payload).toMatchObject({
      'state:note': 'b',
    });
  });
});
