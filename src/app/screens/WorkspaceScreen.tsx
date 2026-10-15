import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  IconAdjustments,
  IconAlertTriangle,
  IconBookmark,
  IconCircleCheck,
  IconCopy,
  IconDownload,
  IconEraser,
  IconStar,
  IconStarFilled,
  IconX,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { useEditorStatus, type WorkspaceTab } from '@/shared/workspace-store';
import { openDialog } from '@/shared/dialog';
import { track } from '@/core/telemetry';
import { useFavorites } from '@/core/favorites-store';
import { useRecentTools } from '@/core/recent-tools';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { getSpec, patchWorkbenchDoc, readDoc, specLanguages, specParams } from '@/features/tools/specs';
import { languageLabel, type EditorLanguage } from '@/shared/editor-language';
import { isDesktopHost } from '@/platform/desktop';
import type { WorkbenchDocState } from '@/shared/workbench';

function lineCount(text: string): number {
  return text ? text.split('\n').length : 0;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The workbench document.
 *
 * Everything a tool needs, in reading order: what it is, what it can do, the
 * input, the result. The two panes share a hairline seam so the eye reads them
 * as one surface, and the status bar reports only facts a developer acts on.
 */
export function WorkspaceScreen({ tab }: { tab: WorkspaceTab }) {
  const spec = getSpec(tab.toolId);
  const doc = readDoc(tab);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const setWrap = useWorkbenchMemory((s) => s.setWrap);
  const remember = useWorkbenchMemory((s) => s.remember);
  const addRun = useWorkbenchMemory((s) => s.addRun);
  const notify = useWorkbenchMemory((s) => s.notify);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecent } = useRecentTools();
  const ln = useEditorStatus((s) => s.ln);
  const col = useEditorStatus((s) => s.col);
  const resetEditorStatus = useEditorStatus((s) => s.reset);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // Track this tool as recently used and reset cursor coordinates on document switch
  useEffect(() => {
    if (spec) addRecent(spec.id);
    resetEditorStatus();
  }, [spec, tab.id, addRecent, resetEditorStatus]);

  // Close options popover when clicking outside
  useEffect(() => {
    if (!optionsOpen) return;
    const handler = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [optionsOpen]);

  // Derived values are built on every render, before any early return, so the
  // hooks below keep a stable call order; the screen bails out after them once
  // it knows the tab has no spec.
  const update = (patch: Partial<WorkbenchDocState>) => patchWorkbenchDoc(tab.id, patch);
  const params = spec ? specParams(doc, spec) : {};
  // Each pane is highlighted with the grammar of what it holds, which is not
  // always the same on both sides: a converter reads one language and writes
  // another, and the status bar says so.
  const languages: { input: EditorLanguage; result: EditorLanguage } = spec
    ? specLanguages(doc, spec)
    : { input: 'text', result: 'text' };

  const transform = useCallback(
    async (mode: string = doc.mode) => {
      if (!spec) return;
      setBusy(true);
      try {
        const { output, error, warning } = await spec.run(doc.input, params, mode);
        if (error) {
          update({ error, warning: '', dirty: true });
          track('transform_failed', { tool_id: spec.id, error_code: 'INVALID_INPUT' });
          return;
        }
        const next = { ...doc, output, mode, error: '', warning: warning ?? '', dirty: false };
        update({ output, mode, error: '', warning: warning ?? '', dirty: false });
        track('transform_succeeded', { tool_id: spec.id });
        if (remember) {
          addRun({
            id: crypto.randomUUID(),
            name: `${spec.title} · ${mode}`,
            toolId: spec.id,
            doc: next,
          });
        }
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec, doc, params, remember, addRun, tab.id],
  );

  // ⌘Enter runs the active mode; ⌘S opens Save Session in browser builds.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        void transform(doc.mode);
      } else if (event.key.toLowerCase() === 's' && !isDesktopHost()) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('wb:save', { detail: 'Sessions' }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [transform, doc.mode]);

  if (!spec) return null;

  const fav = isFavorite(spec.id);
  const setParam = (key: string, value: string | boolean) =>
    update({ params: { ...doc.params, [key]: value }, dirty: true });
  const valid = !!doc.output && !doc.error && !doc.dirty;
  const languageStatus =
    languages.input === languages.result
      ? languageLabel(languages.input)
      : `${languageLabel(languages.input)} → ${languageLabel(languages.result)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(doc.output);
      track('output_copied', { tool_id: spec.id });
      notify('Result copied');
    } catch {
      notify('Clipboard unavailable. Select the result and copy it.');
    }
  };

  const download = () => {
    const blob = new Blob([doc.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `toolbit-result.${spec.fileExt ?? 'txt'}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const inlineOptions = (spec.options ?? []).filter((option) => option.inline);
  const popoverOptions = (spec.options ?? []).filter((option) => !option.inline);

  // The status bar reports whether the result still matches the input, not
  // whether the input itself is valid — the pane header already says that.
  const stateLabel = valid ? 'Up to date' : doc.error ? 'Error' : 'Needs run';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      {/* Tool identity + document actions */}
      <div className="wb-workspace-heading">
        <div className="min-w-0">
          <h1 className="truncate">{spec.title}</h1>
          <p className="truncate">{spec.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={fav ? `Unpin ${spec.title}` : `Pin ${spec.title}`}
            title={fav ? 'Remove from pinned' : 'Pin to top'}
            onClick={() => toggleFavorite(spec.id)}
          >
            {fav ? <IconStarFilled size={15} /> : <IconStar size={15} />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.dispatchEvent(new CustomEvent('wb:save', { detail: 'Sessions' }))}
          >
            <IconBookmark size={14} />
            Save session
          </Button>
        </div>
      </div>

      {/* Actions + options */}
      <div className="wb-toolbar">
        <div className="flex flex-wrap items-center gap-1.5">
          {spec.actions.map(({ mode, label }) => (
            <Button
              key={mode}
              type="button"
              variant={doc.mode === mode ? 'default' : 'outline'}
              size="sm"
              disabled={busy}
              onClick={() => void transform(mode)}
            >
              {label}
            </Button>
          ))}
        </div>

        {inlineOptions.map(
          (option) =>
            option.type === 'select' && (
              <Label key={option.key} className="wb-toolbar-label">
                {option.label}
                {/* `sm` keeps the control the same height as the toolbar's
                    action buttons; mixing control heights in one row is a defect. */}
                <NativeSelect
                  size="sm"
                  aria-label={option.label.replace(/:$/, '')}
                  value={String(params[option.key] ?? '')}
                  onChange={(event) => setParam(option.key, event.target.value)}
                >
                  {option.choices?.map((choice) => (
                    <NativeSelectOption key={choice.value} value={choice.value}>
                      {choice.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Label>
            ),
        )}

        <div ref={optionsRef} className="relative ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-ink-muted"
            aria-expanded={optionsOpen}
            aria-label="Options"
            onClick={() => setOptionsOpen(!optionsOpen)}
          >
            <IconAdjustments size={14} />
            Options
          </Button>
          {/* One floating-layer definition: `.wb-popup` carries the radius,
              hairline, elevation and stacking that every menu in the product
              shares, so this popover cannot drift from the real ones. */}
          {optionsOpen && (
            <div className="wb-popup absolute right-0 top-full mt-1 min-w-[260px] p-1">
              <Label className="flex cursor-pointer items-center gap-2 px-2.5 py-2 text-sm">
                <Checkbox checked={wrap} onCheckedChange={(checked) => setWrap(Boolean(checked))} />
                Wrap long lines
              </Label>
              {popoverOptions.map((option) =>
                option.type === 'checkbox' ? (
                  <Label
                    key={option.key}
                    className="flex cursor-pointer items-center gap-2 px-2.5 py-2 text-sm"
                  >
                    <Checkbox
                      checked={params[option.key] === true}
                      onCheckedChange={(checked) => setParam(option.key, Boolean(checked))}
                    />
                    {option.label}
                  </Label>
                ) : (
                  <Label key={option.key} className="flex flex-col gap-1.5 px-2.5 py-2 text-sm">
                    {option.label}
                    <Input
                      value={String(params[option.key] ?? '')}
                      onChange={(event) => setParam(option.key, event.target.value)}
                    />
                  </Label>
                ),
              )}
              {spec.note && (
                <p className="border-t border-line px-2.5 py-2 text-xs text-ink-faint">
                  {spec.note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics */}
      {doc.error && (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{doc.error}</span>
          <small>The previous result is kept for reference. Run again before copying.</small>
        </div>
      )}
      {!doc.error && doc.warning && (
        <div className="wb-warning-banner" role="status">
          <span className="flex items-center gap-1.5">
            <IconAlertTriangle size={14} aria-hidden="true" />
            <strong>Precision warning</strong>
          </span>
          <span>{doc.warning}</span>
        </div>
      )}

      {/* Input → result */}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Input panel">
          <div className="wb-pane-header">
            <h2>Input</h2>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="ml-auto gap-1.5 text-ink-muted"
              onClick={() => update({ input: '', error: '', warning: '', dirty: true })}
            >
              <IconEraser size={13} />
              Clear
            </Button>
          </div>
          <CodeEditor
            key={`${tab.id}-input`}
            value={doc.input}
            onChange={(input) => update({ input, dirty: true, error: '' })}
            wrap={wrap}
            reportStatus
            label="Input code"
            language={languages.input}
          />
          <div className="wb-pane-footer">
            <span>
              {lineCount(doc.input)} {doc.input.includes('\n') ? 'lines' : 'line'}
            </span>
            <span>{formatBytes(doc.input.length)}</span>
          </div>
        </section>

        <section className="wb-editor-pane" aria-label="Result panel">
          <div className="wb-pane-header">
            <h2>Result</h2>
            {valid && (
              <span className="flex items-center gap-1 text-2xs text-success">
                <IconCircleCheck size={13} aria-hidden="true" />
                {spec.resultLabel ?? 'Complete'}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="ml-auto gap-1.5 text-ink-muted"
              disabled={!valid}
              onClick={() => void copy()}
            >
              <IconCopy size={13} />
              Copy result
            </Button>
          </div>
          <CodeEditor
            key={`${tab.id}-output`}
            value={doc.output}
            readOnly
            wrap={wrap}
            label="Result code"
            language={languages.result}
          />
          <div className="wb-pane-footer">
            <span>{lineCount(doc.output)} lines</span>
            <span>{formatBytes(doc.output.length)}</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="ml-auto gap-1.5 text-ink-muted"
              disabled={!valid}
              onClick={download}
            >
              <IconDownload size={13} />
              Download
            </Button>
          </div>
        </section>
      </div>

      {/* Status */}
      <div className="wb-statusbar" role="status">
        <span className="wb-statusbar-item">
          <span
            className={`size-1.5 rounded-full ${
              valid ? 'bg-success' : doc.error ? 'bg-danger' : 'bg-ink-faint'
            }`}
            aria-hidden="true"
          />
          {stateLabel}
        </span>
        <span className="wb-statusbar-sep" aria-hidden="true" />
        <span className="wb-statusbar-item">
          Ln {ln}, Col {col}
        </span>
        <span className="wb-statusbar-sep" aria-hidden="true" />
        <span className="wb-statusbar-item">
          {wrap ? 'Wrapped' : 'No wrap'} · {languageStatus}
        </span>
        <span className="wb-statusbar-sep" aria-hidden="true" />
        <span className="wb-statusbar-item">Local only</span>
      </div>

      <SaveDialog tab={tab} />
    </div>
  );
}

/**
 * Save dialog.
 *
 * Saving keeps a *session*: input, result and options together, so reopening
 * restores the exact working state rather than just the output.
 */
function SaveDialog({ tab }: { tab: WorkspaceTab }) {
  const addSaved = useWorkbenchMemory((s) => s.addSaved);
  const notify = useWorkbenchMemory((s) => s.notify);
  const [open, setOpen] = useState<'Sessions' | 'Snippets' | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const handler = (event: Event) => {
      const kind = (event as CustomEvent<'Sessions' | 'Snippets'>).detail;
      setOpen(kind ?? 'Sessions');
      setName('');
    };
    window.addEventListener('wb:save', handler);
    return () => window.removeEventListener('wb:save', handler);
  }, []);

  if (!open) return null;
  const doc = readDoc(tab);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addSaved({
      id: crypto.randomUUID(),
      name: trimmed,
      kind: open,
      toolId: tab.toolId,
      doc: open === 'Sessions' ? doc : null,
      input: open === 'Snippets' ? doc.output : doc.input,
      example: false,
    });
    setOpen(null);
    notify(`${open === 'Sessions' ? 'Session' : 'Snippet'} saved for this session`);
  };

  return (
    <dialog
      className="w-full max-w-md rounded-xl border border-line bg-raised p-5 shadow-lg"
      aria-labelledby="wb-save-title"
      ref={(node) => {
        openDialog(node);
        if (node?.open) node.querySelector('input')?.focus();
      }}
      onClose={() => setOpen(null)}
    >
      <form onSubmit={submit}>
        <div className="flex items-center justify-between">
          <h2 id="wb-save-title" className="text-lg font-semibold">
            Save {open === 'Sessions' ? 'session' : 'snippet'}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close save dialog"
            onClick={() => setOpen(null)}
          >
            <IconX size={16} />
          </Button>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {open === 'Sessions'
            ? 'Keep this tool\u2019s input, result, and options together.'
            : 'Keep this result ready to reuse.'}
        </p>
        <Label className="mt-4 flex flex-col gap-1.5 text-sm">
          Name
          <Input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={open === 'Sessions' ? 'e.g. Webhook inspection' : 'e.g. Invoice payload'}
          />
        </Label>
        <p className="mt-2 text-xs text-ink-faint">
          Saved in this session. Refreshing resets saved work.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(null)}>
            Cancel
          </Button>
          <Button type="submit" className="gap-1.5">
            <IconBookmark size={15} />
            Save {open === 'Sessions' ? 'session' : 'snippet'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
