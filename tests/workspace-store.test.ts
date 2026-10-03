import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspace, useEditorStatus } from '@/shared/workspace-store';

function reset() {
  useWorkspace.setState({
    tabs: [],
    activeTabId: null,
    closed: [],
    view: { kind: 'tool' },
    density: 'comfortable',
    inspectorOpen: true,
  });
}

beforeEach(reset);

describe('workspace tabs', () => {
  it('ignores unknown tool ids', () => {
    useWorkspace.getState().openTool('nope');
    expect(useWorkspace.getState().openDocument('nope')).toBeNull();
    expect(useWorkspace.getState().tabs).toEqual([]);
  });

  it('reuses the existing tab unless a new document is forced', () => {
    const s = useWorkspace.getState();
    s.openTool('json-formatter');
    const first = useWorkspace.getState().activeTabId!;
    s.openTool('json-formatter');
    expect(useWorkspace.getState().tabs).toHaveLength(1);
    expect(useWorkspace.getState().activeTabId).toBe(first);
    s.openTool('json-formatter', true);
    expect(useWorkspace.getState().tabs).toHaveLength(2);
  });

  it('opens seeded documents and patches them', () => {
    const id = useWorkspace.getState().openDocument('base64-encoder', { input: 'hi' })!;
    expect(useWorkspace.getState().activeTabId).toBe(id);
    useWorkspace.getState().patchDocument(id, { options: { mode: 'decode' } });
    const tab = useWorkspace.getState().tabs.find((t) => t.id === id)!;
    expect(tab.payload).toMatchObject({ input: 'hi' });
    expect(tab.options).toMatchObject({ mode: 'decode' });
    useWorkspace.getState().patchDocument('missing', {});
    expect(useWorkspace.getState().tabs).toHaveLength(1);
  });

  it('closes the active tab onto its neighbour and caps the closed stack', () => {
    const s = useWorkspace.getState();
    const ids = [
      s.openDocument('json-formatter')!,
      s.openDocument('base64-encoder')!,
      s.openDocument('url-encoder')!,
    ];
    s.setActiveTab(ids[1]);
    expect(s.closeTab(ids[1])).toBe('url-encoder');
    expect(useWorkspace.getState().activeTabId).toBe(ids[2]);
    // Closing a background tab keeps the active tab.
    expect(s.closeTab(ids[0])).toBe('url-encoder');
    expect(useWorkspace.getState().activeTabId).toBe(ids[2]);
    // Unknown id leaves everything alone.
    expect(s.closeTab('missing')).toBe(ids[2]);

    reset();
    for (let i = 0; i < 11; i++) useWorkspace.getState().openDocument('json-formatter');
    for (const tab of [...useWorkspace.getState().tabs]) useWorkspace.getState().closeTab(tab.id);
    expect(useWorkspace.getState().closed).toHaveLength(10);
    expect(useWorkspace.getState().activeTabId).toBeNull();
  });

  it('reopens closed tabs most-recent-first', () => {
    expect(useWorkspace.getState().reopen()).toBeNull();
    const s = useWorkspace.getState();
    s.openDocument('json-formatter');
    const second = s.openDocument('base64-encoder')!;
    s.closeTab(second);
    expect(s.reopen()).toBe('base64-encoder');
    expect(useWorkspace.getState().activeTabId).toBe(second);
  });

  it('restores a saved workspace with fresh ids', () => {
    useWorkspace.getState().restore({
      id: 'w',
      name: 'W',
      createdAt: 1,
      tools: [{ toolId: 'json-formatter', state: '{"input":"a"}' }],
    } as never);
    const { tabs, activeTabId, view } = useWorkspace.getState();
    expect(tabs).toHaveLength(1);
    expect(tabs[0].toolId).toBe('json-formatter');
    expect(activeTabId).toBe(tabs[0].id);
    expect(view).toEqual({ kind: 'tool' });
  });

  it('switches views, density, and inspector', () => {
    const s = useWorkspace.getState();
    const id = s.openDocument('json-formatter')!;
    s.showCatalog('format');
    expect(useWorkspace.getState().view).toEqual({ kind: 'catalog', category: 'format' });
    s.setActiveTab(id); // selecting a tab returns to the tool view
    expect(useWorkspace.getState().view).toEqual({ kind: 'tool' });
    s.setActiveTab('missing');
    expect(useWorkspace.getState().activeTabId).toBe(id);
    s.showTool();
    s.setDensity('compact');
    expect(useWorkspace.getState().density).toBe('compact');
    s.toggleInspector();
    expect(useWorkspace.getState().inspectorOpen).toBe(false);
    s.toggleInspector();
    expect(useWorkspace.getState().inspectorOpen).toBe(true);
  });
});

describe('editor status', () => {
  it('patches and resets', () => {
    useEditorStatus.getState().setStatus({ valid: true, bytes: 3 });
    expect(useEditorStatus.getState()).toMatchObject({ valid: true, bytes: 3 });
    useEditorStatus.getState().reset();
    expect(useEditorStatus.getState()).toMatchObject({ valid: null, bytes: 0 });
  });
});
