import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useState } from 'react';
import { Router } from 'wouter';
import { useWorkspace } from '@/shared/workspace-store';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { toolPath, useWorkbenchActions } from '@/shared/workbench-actions';
import { defaultDocState } from '@/features/tools/specs';

const seedSaved = [...useWorkbenchMemory.getState().saved];

function reset() {
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [], view: { kind: 'tool' } });
  useWorkbenchMemory.setState({ saved: seedSaved, runs: [], remember: false, toast: '' });
}

type Actions = ReturnType<typeof useWorkbenchActions>;

function Probe({ onActions }: { onActions: (a: Actions) => void }) {
  const actions = useWorkbenchActions();
  onActions(actions);
  return null;
}

function renderProbe(onActions: (a: Actions) => void, pushes: string[]) {
  function Shell() {
    const [path, setPath] = useState('/');
    return (
      <Router
        hook={() => [
          path,
          (to: string) => {
            pushes.push(to);
            setPath(to);
          },
        ]}
      >
        <Probe onActions={onActions} />
        <span data-testid="path">{path}</span>
      </Router>
    );
  }
  return render(<Shell />);
}

beforeEach(reset);

describe('toolPath', () => {
  it('resolves catalog paths and falls back to root', () => {
    expect(toolPath('json-formatter')).toBe('/json-formatter');
    expect(toolPath('nope')).toBe('/');
  });
});

describe('workbench actions', () => {
  it('opens workbench tools as labelled documents and navigates', () => {
    let actions!: Actions;
    const pushes: string[] = [];
    renderProbe((a) => {
      actions = a;
    }, pushes);
    act(() => {
      actions.openTool('base64-encoder', 'hi');
    });
    const { tabs } = useWorkspace.getState();
    expect(tabs).toHaveLength(1);
    expect(tabs[0].payload).toMatchObject({ input: 'hi' });
    expect(pushes).toEqual(['/base64-encoder']);
    expect(screen.getByTestId('path')).toHaveTextContent('/base64-encoder');
    // A second open numbers the label.
    act(() => {
      actions.openTool('base64-encoder', 'again');
    });
    expect(useWorkspace.getState().tabs).toHaveLength(2);
  });

  it('navigates custom tools without creating documents', () => {
    let actions!: Actions;
    const pushes: string[] = [];
    renderProbe((a) => {
      actions = a;
    }, pushes);
    act(() => {
      actions.openTool('jwt-decoder');
    });
    expect(useWorkspace.getState().tabs).toHaveLength(0);
    expect(pushes).toEqual(['/jwt-decoder']);
  });

  it('activates the existing tab instead of duplicating', () => {
    let actions!: Actions;
    const pushes: string[] = [];
    renderProbe((a) => {
      actions = a;
    }, pushes);
    act(() => {
      actions.openTool('json-formatter', 'a');
    });
    act(() => {
      actions.activateExistingOrOpen('json-formatter');
    });
    expect(useWorkspace.getState().tabs).toHaveLength(1);
    act(() => {
      actions.activateExistingOrOpen('url-encoder');
    });
    expect(useWorkspace.getState().tabs).toHaveLength(2);
  });

  it('restores sessions, snippets, and the example recipe', () => {
    let actions!: Actions;
    renderProbe((a) => {
      actions = a;
    }, []);
    act(() => {
      actions.restore({
        kind: 'Sessions',
        toolId: 'base64-encoder',
        doc: { ...defaultDocState('base64-encoder', 'hi'), label: 'Saved' },
        input: 'hi',
        name: 'Saved',
      });
    });
    expect(useWorkspace.getState().tabs.some((t) => t.toolId === 'base64-encoder')).toBe(true);

    const example = useWorkbenchMemory.getState().saved.find((s) => s.kind === 'Examples')!;
    act(() => {
      actions.restore(example);
    });
    const jsonTab = useWorkspace.getState().tabs.find((t) => t.toolId === 'json-formatter');
    expect(jsonTab?.payload).toMatchObject({ dirty: false });
    expect(useWorkbenchMemory.getState().toast).toBe('Example complete: decoded and formatted');

    act(() => {
      actions.restore({ kind: 'Snippets', toolId: 'x', doc: null, input: 'snip', name: 'S' });
    });
    expect(useWorkspace.getState().tabs.some((t) => t.toolId === 'json-formatter')).toBe(true);
  });

  it('reports broken recipe input instead of opening anything', () => {
    let actions!: Actions;
    renderProbe((a) => {
      actions = a;
    }, []);
    const before = useWorkspace.getState().tabs.length;
    act(() => {
      actions.restore({ kind: 'Examples', toolId: 'x', doc: null, input: '!!!', name: 'Bad' });
    });
    expect(useWorkspace.getState().tabs).toHaveLength(before);
    expect(useWorkbenchMemory.getState().toast).toBe('Example input must be Base64-encoded JSON.');
  });
});

describe('workbench memory seeds', () => {
  it('ships example session, recipe, and snippet', () => {
    const kinds = useWorkbenchMemory
      .getState()
      .saved.map((s) => s.kind)
      .sort();
    expect(kinds).toEqual(['Examples', 'Sessions', 'Snippets']);
  });

  it('prepends runs capped at 20 and toasts', () => {
    const mem = useWorkbenchMemory.getState();
    for (let i = 0; i < 25; i++)
      mem.addRun({ id: `${i}`, name: `${i}`, toolId: 'x', doc: defaultDocState('json-formatter') });
    expect(useWorkbenchMemory.getState().runs).toHaveLength(20);
    expect(useWorkbenchMemory.getState().runs[0].id).toBe('24');
    mem.notify('hi');
    expect(useWorkbenchMemory.getState().toast).toBe('hi');
    mem.clearToast();
    expect(useWorkbenchMemory.getState().toast).toBe('');
    mem.setRemember(true);
    mem.setWrap(false);
    expect(useWorkbenchMemory.getState()).toMatchObject({ remember: true, wrap: false });
  });
});
