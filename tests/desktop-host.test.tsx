import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import App from '@/app/App';
import { DESKTOP_EVENT, isDesktopHost } from '@/platform/desktop';
import { defaultDocState } from '@/features/tools/specs';
import { runXml } from '@/features/tools/xml-formatter/XmlScreen';
import { useActiveResult } from '@/shared/result-store';
import { useWorkspace } from '@/shared/workspace-store';

interface HostStub {
  readonly invocations: Array<{ command: string; args?: Record<string, unknown> }>;
  readonly commands: Record<string, unknown>;
  emit(event: string, payload?: unknown): void;
  listening(): string[];
}

/**
 * Stands in for the core API the Tauri shell injects through `withGlobalTauri`.
 * `emit` is how the Rust menu and the OS reach the app: the shell emits the
 * event name it used as the menu item's id.
 */
function installShell(commands: Record<string, unknown> = {}): HostStub {
  const listeners = new Map<string, (event: { payload: unknown }) => void>();
  const invocations: Array<{ command: string; args?: Record<string, unknown> }> = [];
  const shell: HostStub = {
    invocations,
    commands,
    emit: (event, payload) => {
      const handler = listeners.get(event);
      if (!handler) throw new Error(`nothing in the app listens for ${event}`);
      handler({ payload });
    },
    listening: () => [...listeners.keys()],
  };

  Object.defineProperty(window, '__TAURI__', {
    configurable: true,
    value: {
      core: {
        invoke: (command: string, args?: Record<string, unknown>) => {
          invocations.push({ command, args });
          const answer = commands[command];
          // An `Error` stands in for the shell's own refusal, which arrives as a
          // message string over IPC.
          return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer ?? null);
        },
      },
      event: {
        listen: (event: string, handler: (event: { payload: unknown }) => void) => {
          listeners.set(event, handler);
          return Promise.resolve(() => {
            listeners.delete(event);
          });
        },
      },
    },
  });

  return shell;
}

/** The shell wires its listeners asynchronously, so every test waits for them. */
async function renderInstalled(commands: Record<string, unknown> = {}) {
  const shell = installShell(commands);
  render(<App />);
  await waitFor(() => expect(shell.listening()).toContain(DESKTOP_EVENT.openPath));
  return shell;
}

function activeDocument() {
  const { tabs, activeTabId } = useWorkspace.getState();
  return tabs.find((tab) => tab.id === activeTabId);
}

describe('desktop host', () => {
  beforeEach(() => {
    useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  });

  afterEach(() => {
    // The global only exists inside the shell; leaving it behind would make the
    // next test file believe it is running installed.
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    // A test that navigates to a tool would otherwise mount the next one there.
    window.history.replaceState(null, '', '/');
    useActiveResult.getState().clear();
  });

  it('detects the shell at runtime and stays a browser app without it', () => {
    expect(isDesktopHost()).toBe(false);
    installShell();
    expect(isDesktopHost()).toBe(true);
  });

  it('opens the palette from the native Quick Open command', async () => {
    const shell = await renderInstalled();
    const palette = () => screen.queryByPlaceholderText(/type a category/);
    expect(palette()).not.toBeInTheDocument();

    act(() => shell.emit(DESKTOP_EVENT.quickOpen));

    expect(await waitFor(() => expect(palette()).toBeInTheDocument()));
  });

  it('loads a file the OS opens into the active document', async () => {
    const shell = await renderInstalled({
      read_text_file: {
        path: '/tmp/invoice.json',
        name: 'invoice.json',
        contents: '{"a":1}',
      },
    });
    const id = useWorkspace
      .getState()
      .openDocument('json-formatter', { ...defaultDocState('json-formatter') });
    expect(id).toBeTruthy();

    await act(async () => shell.emit(DESKTOP_EVENT.openPath, '/tmp/invoice.json'));

    await waitFor(() => {
      expect(activeDocument()?.payload?.input).toBe('{"a":1}');
    });
    expect(shell.invocations).toContainEqual({
      command: 'read_text_file',
      args: { path: '/tmp/invoice.json' },
    });
  });

  it('saves the active result through the native panel', async () => {
    const shell = await renderInstalled({
      save_text_file: '/tmp/result.json',
    });
    useWorkspace.setState({ tabs: [], activeTabId: null });
    const id = useWorkspace.getState().openDocument('json-formatter', {
      ...defaultDocState('json-formatter'),
      output: '{\n  "a": 1\n}',
    });
    expect(id).toBeTruthy();

    await act(async () => shell.emit(DESKTOP_EVENT.saveResult));

    await waitFor(() => {
      expect(shell.invocations).toContainEqual({
        command: 'save_text_file',
        args: { defaultName: 'toolbit-result.json', contents: '{\n  "a": 1\n}' },
      });
    });
  });

  it('fills the custom screen on screen from a file the OS opens', async () => {
    const shell = await renderInstalled({
      read_text_file: {
        path: '/tmp/policy.xml',
        name: 'policy.xml',
        contents: '<policy><rule id="1" /></policy>',
      },
    });
    useWorkspace.setState({ tabs: [], activeTabId: null });
    const id = useWorkspace
      .getState()
      .openDocument('xml-formatter', { ...defaultDocState('xml-formatter') });
    expect(id).toBeTruthy();

    await act(async () => shell.emit(DESKTOP_EVENT.openPath, '/tmp/policy.xml'));

    await waitFor(() => {
      expect(activeDocument()?.payload?.input).toBe('<policy><rule id="1" /></policy>');
    });
    // The file's name becomes the document label, as it does for a workbench tool.
    expect(activeDocument()?.payload?.label).toBe('policy.xml');
  });

  it('saves the result a custom screen computed through the native panel', async () => {
    const input = '<policy><rule id="1" /></policy>';
    const expected = runXml(input, 'prettify', '').output;
    expect(expected).toContain('<rule id="1" />');

    window.history.replaceState(null, '', '/xml-formatter');
    useWorkspace.setState({ tabs: [], activeTabId: null });
    useWorkspace
      .getState()
      .openDocument('xml-formatter', { ...defaultDocState('xml-formatter'), input });
    const shell = await renderInstalled({ save_text_file: '/tmp/result.xml' });
    expect(await screen.findByRole('heading', { level: 1, name: 'XML' })).toBeInTheDocument();

    await act(async () => shell.emit(DESKTOP_EVENT.saveResult));

    await waitFor(() => {
      expect(shell.invocations).toContainEqual({
        command: 'save_text_file',
        args: { defaultName: 'toolbit-result.xml', contents: expected },
      });
    });
  });

  it('saves nothing for a custom screen that has no result yet', async () => {
    window.history.replaceState(null, '', '/xml-formatter');
    useWorkspace.setState({ tabs: [], activeTabId: null });
    useWorkspace
      .getState()
      .openDocument('xml-formatter', { ...defaultDocState('xml-formatter'), input: '' });
    const shell = await renderInstalled({ save_text_file: '/tmp/result.xml' });
    expect(await screen.findByRole('heading', { level: 1, name: 'XML' })).toBeInTheDocument();

    await act(async () => shell.emit(DESKTOP_EVENT.saveResult));

    expect(await screen.findByText('Run the tool before saving a result.')).toBeInTheDocument();
    expect(shell.invocations.some((call) => call.command === 'save_text_file')).toBe(false);
  });

  it('reports a refused drop instead of failing silently', async () => {
    const shell = await renderInstalled({
      read_text_file: new Error('The file exceeds the supported 50 MB limit'),
    });
    const id = useWorkspace
      .getState()
      .openDocument('json-formatter', { ...defaultDocState('json-formatter') });
    expect(id).toBeTruthy();

    // An oversized file, a directory or a binary all arrive as a refusal.
    await act(async () => shell.emit('tauri://drag-drop', { paths: ['/tmp/huge.json'] }));

    expect(await screen.findByText(/50 MB limit/)).toBeInTheDocument();
  });

  it('serves the marketing page on the web and hides it when installed', async () => {
    window.history.replaceState(null, '', '/about');
    render(<App />);
    expect(
      await screen.findByRole('heading', { level: 1, name: /Every small developer task/ }),
    ).toBeInTheDocument();
  });

  it('falls through to not found for the marketing page when installed', async () => {
    window.history.replaceState(null, '', '/about');
    await renderInstalled();
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('collects nothing and offers no consent control when installed', async () => {
    await renderInstalled();
    expect(screen.queryByRole('button', { name: /Product analytics/ })).not.toBeInTheDocument();
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });
});
