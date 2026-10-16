/**
 * Desktop host bridge.
 *
 * The installed app is this same build, presented by the Tauri shell in
 * `Desktop/desktop-tauri`. That shell enables `withGlobalTauri`, so Tauri's core
 * API is already on `window.__TAURI__` — which means the web bundle imports no
 * Tauri package and stays a plain browser app, while one runtime check decides
 * whether the native menu, file panels and OS file drops exist.
 *
 * The Rust half of this contract lives in
 * `Desktop/desktop-tauri/src-tauri/src/main.rs`. Change one, change both.
 */

export interface OpenedFile {
  /** Absolute path, for messages and for re-reading. */
  path: string;
  /** File name, used as the document label. */
  name: string;
  contents: string;
}

/**
 * Event names. The shell builds its menu items with these strings as ids, so a
 * menu click arrives here carrying the same name.
 */
export const DESKTOP_EVENT = {
  quickOpen: 'toolbit://menu/quick-open',
  settings: 'toolbit://menu/settings',
  openFile: 'toolbit://menu/open-file',
  saveResult: 'toolbit://menu/save-result',
  closeDocument: 'toolbit://menu/close-document',
  /** A path the OS wants opened: file association, drop, or second launch. */
  openPath: 'toolbit://open-path',
} as const;

export type DesktopEventName = (typeof DESKTOP_EVENT)[keyof typeof DESKTOP_EVENT];

/**
 * Build-time target flags. `import.meta.env` is a Vite injection; node-side
 * scripts (tsx: the embedding generator, the intent eval) import this module
 * through the tool catalogue and have no such object, so the read has to
 * survive `undefined` — there it is always the web target.
 */
const viteEnv = import.meta.env as ImportMetaEnv | undefined;

/** Build-time desktop target. Gates code that has no meaning in a browser. */
export const isDesktopBuild = viteEnv?.VITE_TARGET === 'desktop';

/** Vite's dev flag — false in every bundle, and outside Vite entirely. */
export const isDevBuild = viteEnv?.DEV === true;

interface TauriCore {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
}

interface TauriEventApi {
  listen<T>(event: string, handler: (event: { payload: T }) => void): Promise<() => void>;
}

interface DesktopHostApi {
  core: TauriCore;
  event: TauriEventApi;
}

function host(): DesktopHostApi | null {
  if (typeof window === 'undefined') return null;
  const api = (window as Window & { __TAURI__?: Partial<DesktopHostApi> }).__TAURI__;
  if (!api?.core || !api.event) return null;
  return { core: api.core, event: api.event };
}

/**
 * True only inside the installed app: every browser, including the installed
 * PWA, gets false. Safe to call during render — the shell injects its global
 * before the page's first script runs.
 */
export function isDesktopHost(): boolean {
  return host() !== null;
}

/** Native open panel. Resolves to null when the user cancels. */
export async function openFile(): Promise<OpenedFile | null> {
  const api = host();
  if (!api) return null;
  return api.core.invoke<OpenedFile | null>('open_text_file');
}

/** Native save panel. Resolves to the chosen path, or null when cancelled. */
export async function saveFile(defaultName: string, contents: string): Promise<string | null> {
  const api = host();
  if (!api) return null;
  return api.core.invoke<string | null>('save_text_file', { defaultName, contents });
}

export async function readFile(path: string): Promise<OpenedFile> {
  const api = host();
  if (!api) throw new Error('The desktop host is not running.');
  return api.core.invoke<OpenedFile>('read_text_file', { path });
}

/**
 * First path the OS handed the shell before the workspace was listening — a
 * second launch, a file association, or a command-line argument.
 */
export async function takePendingOpenPath(): Promise<string | null> {
  const api = host();
  if (!api) return null;
  return api.core.invoke<string | null>('take_pending_open_path');
}

/**
 * Native menu commands. Resolves to a disposer; outside the shell it resolves to
 * a no-op disposer so callers never branch on the host.
 */
export async function onDesktopMenu(
  handler: (name: DesktopEventName) => void,
): Promise<() => void> {
  const api = host();
  if (!api) return () => {};
  const names = Object.values(DESKTOP_EVENT).filter((name) => name !== DESKTOP_EVENT.openPath);
  const disposers = await Promise.all(
    names.map((name) => api.event.listen(name, () => handler(name))),
  );
  return () => disposers.forEach((dispose) => dispose());
}

/** Paths dropped onto the window. This is the shell's event, not the DOM's. */
export async function onFileDrop(handler: (paths: string[]) => void): Promise<() => void> {
  const api = host();
  if (!api) return () => {};
  return api.event.listen<{ paths?: string[] }>('tauri://drag-drop', (event) => {
    const paths = event.payload?.paths ?? [];
    if (paths.length) handler(paths);
  });
}

/** A path the OS wants opened while the app is already running. */
export async function onOpenPath(handler: (path: string) => void): Promise<() => void> {
  const api = host();
  if (!api) return () => {};
  return api.event.listen<string>(DESKTOP_EVENT.openPath, (event) => handler(event.payload));
}

/**
 * The shell's failures are already sentences the user can act on ("The file
 * exceeds the supported 50 MB limit", "Choose a UTF-8 text file"), so they are
 * shown as-is rather than wrapped in framework wording.
 */
export function desktopErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error) return error;
  if (error instanceof Error && error.message) return error.message;
  return 'The desktop host could not complete that.';
}
