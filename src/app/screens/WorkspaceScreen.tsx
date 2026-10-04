import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import {
  IconBookmark,
  IconChevronDown,
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconDownload,
  IconFile,
  IconFileCode,
  IconSettings,
  IconX,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { openDialog } from '@/shared/dialog';
import { track } from '@/core/telemetry';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { getSpec, patchWorkbenchDoc, readDoc, specParams } from '@/features/tools/specs';
import type { WorkbenchDocState } from '@/shared/workbench';
import type { WorkspaceTab } from '@/shared/workspace-store';

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
  children,
}: {
  icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className={`wb-button${active ? ' primary' : ''}`}
      onClick={onClick}
    >
      <Icon size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
      {children}
    </Button>
  );
}

function lineCount(text: string): number {
  return text ? text.split('\n').length : 0;
}

export function WorkspaceScreen({ tab }: { tab: WorkspaceTab }) {
  const spec = getSpec(tab.toolId);
  const doc = readDoc(tab);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const setWrap = useWorkbenchMemory((s) => s.setWrap);
  const remember = useWorkbenchMemory((s) => s.remember);
  const addRun = useWorkbenchMemory((s) => s.addRun);
  const notify = useWorkbenchMemory((s) => s.notify);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveKind, setSaveKind] = useState<'Sessions' | 'Snippets'>('Sessions');

  if (!spec) return null;

  const update = (patch: Partial<WorkbenchDocState>) => patchWorkbenchDoc(tab.id, patch);
  const setParam = (key: string, value: string | boolean) =>
    update({ params: { ...doc.params, [key]: value }, dirty: true });
  const params = specParams(doc, spec);
  const valid = !!doc.output && !doc.error && !doc.dirty;
  const isJson = spec.language === 'json';
  const ActionIcon = spec.actions.length === 1 ? spec.icon : IconFileCode;

  const transform = async (mode: string = doc.mode) => {
    setBusy(true);
    try {
      const { output, error } = await spec.run(doc.input, params, mode);
      if (error) {
        update({ error, dirty: true });
        track('transform_failed', { tool_id: spec.id, error_code: 'INVALID_INPUT' });
        return;
      }
      const next = { ...doc, output, mode, error: '', dirty: false };
      update({ output, mode, error: '', dirty: false });
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
  };

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
    setCopyMenuOpen(false);
  };

  const startSave = (kind: 'Sessions' | 'Snippets') => {
    setSaveKind(kind);
    window.dispatchEvent(new CustomEvent('wb:save', { detail: kind }));
  };

  const inlineOptions = (spec.options ?? []).filter((o) => o.inline);
  const popoverOptions = (spec.options ?? []).filter((o) => !o.inline);

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>{spec.title}</h1>
          <p>{spec.description}</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>

      <div className="wb-toolbar">
        <div className="wb-transform-actions">
          {spec.actions.map(({ mode, label }) => (
            <ToolbarButton
              key={mode}
              icon={ActionIcon}
              active={doc.mode === mode}
              onClick={() => transform(mode)}
            >
              {label}
            </ToolbarButton>
          ))}
        </div>
        {inlineOptions.map(
          (option) =>
            option.type === 'select' && (
              <Label key={option.key} className="wb-indent-label">
                {option.label}
                <NativeSelect
                  aria-label={option.label.replace(/:$/, '')}
                  value={String(params[option.key] ?? '')}
                  onChange={(e) => setParam(option.key, e.target.value)}
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
        <div className="wb-options-wrap">
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen(!optionsOpen)}
          >
            <IconSettings size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
            Options
            <IconChevronDown size={18} data-icon="inline-end" />
          </Button>
          {optionsOpen && (
            <div className="wb-popover wb-options-panel">
              <Label className="cursor-pointer">
                <Checkbox checked={wrap} onCheckedChange={(checked) => setWrap(Boolean(checked))} />
                Wrap long lines
              </Label>
              {popoverOptions.map((option) =>
                option.type === 'checkbox' ? (
                  <Label key={option.key} className="cursor-pointer">
                    <Checkbox
                      checked={params[option.key] === true}
                      onCheckedChange={(checked) => setParam(option.key, Boolean(checked))}
                    />
                    {option.label}
                  </Label>
                ) : (
                  <Label key={option.key}>
                    {option.label}
                    <Input
                      value={String(params[option.key] ?? '')}
                      onChange={(e) => setParam(option.key, e.target.value)}
                    />
                  </Label>
                ),
              )}
              {spec.note && <p>{spec.note}</p>}
              <p>
                Apply changes with{' '}
                {spec.actions.length > 1 ? 'an action button' : 'the transform button'}.
              </p>
            </div>
          )}
        </div>
      </div>

      {doc.error && (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{doc.error}</span>
          <small>The previous result is kept for reference. Run again before copying.</small>
        </div>
      )}

      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Input panel">
          <div className="wb-pane-header">
            <h2>Input</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="wb-button quiet wb-clear"
              onClick={() => update({ input: '', error: '', dirty: true })}
            >
              <IconFile size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
              Clear
            </Button>
          </div>
          <CodeEditor
            key={`${tab.id}-input`}
            value={doc.input}
            onChange={(input) => update({ input, dirty: true, error: '' })}
            wrap={wrap}
            label="Input code"
            language={isJson ? 'json' : 'text'}
          />
          <div className="wb-pane-footer">
            <span>
              {lineCount(doc.input)} {doc.input.includes('\n') ? 'lines' : 'line'}
            </span>
            <span>{doc.input.length} characters</span>
            <span className="wb-file-type">
              {isJson ? 'JSON' : 'Text'}
              <IconChevronDown size={16} />
            </span>
          </div>
        </section>

        <section className="wb-editor-pane" aria-label="Result panel">
          <div className="wb-pane-header">
            <h2>Result</h2>
            <span className={valid ? 'wb-result-state wb-green' : 'wb-result-state'}>
              {valid ? (
                <>
                  <IconCircleCheckFilled size={18} />
                  {spec.resultLabel ?? (busy ? 'Working' : 'Complete')}
                </>
              ) : doc.error ? (
                'Needs attention'
              ) : (
                'Run to update'
              )}
            </span>
            <div className="wb-copy-actions">
              <Button
                type="button"
                variant="default"
                className="wb-button primary"
                disabled={!valid}
                onClick={copy}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
                Copy result
              </Button>
              <Button
                type="button"
                variant="default"
                size="icon"
                className="wb-copy-more"
                aria-label="More result actions"
                aria-expanded={copyMenuOpen}
                onClick={() => setCopyMenuOpen(!copyMenuOpen)}
              >
                <IconChevronDown size={18} />
              </Button>
              {copyMenuOpen && (
                <div className="wb-popover wb-copy-popover">
                  <Button type="button" variant="ghost" disabled={!valid} onClick={download}>
                    <IconDownload size={20} data-icon="inline-start" />
                    Download result
                  </Button>
                </div>
              )}
            </div>
          </div>
          <CodeEditor
            key={`${tab.id}-output`}
            value={doc.output}
            readOnly
            wrap={wrap}
            label="Result code"
            language={isJson ? 'json' : 'text'}
          />
          <div className="wb-pane-footer">
            <span>{lineCount(doc.output)} lines</span>
            <span>{doc.output.length} characters</span>
            <span className="wb-file-type">{isJson ? 'JSON' : 'Text'}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wb-icon-button"
              aria-label="Copy output"
              disabled={!valid}
              onClick={copy}
            >
              <IconCopy size={20} />
            </Button>
          </div>
        </section>
      </div>

      <footer className="wb-workspace-footer">
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => startSave('Sessions')}
        >
          <IconBookmark size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
          Save session
        </Button>
      </footer>
      <SaveListener tab={tab} kind={saveKind} />
    </>
  );
}

/** Listens for footer save requests and stores the snapshot in memory. */
function SaveListener({ tab, kind }: { tab: WorkspaceTab; kind: 'Sessions' | 'Snippets' }) {
  const addSaved = useWorkbenchMemory((s) => s.addSaved);
  const notify = useWorkbenchMemory((s) => s.notify);
  const [dialogKind, setDialogKind] = useState<'Sessions' | 'Snippets' | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const handler = (event: Event) => {
      setDialogKind((event as CustomEvent<'Sessions' | 'Snippets'>).detail ?? kind);
      setName('');
    };
    window.addEventListener('wb:save', handler);
    return () => window.removeEventListener('wb:save', handler);
  }, [kind]);

  if (!dialogKind) return null;
  const doc = readDoc(tab);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addSaved({
      id: crypto.randomUUID(),
      name: trimmed,
      kind: dialogKind,
      toolId: tab.toolId,
      doc: dialogKind === 'Sessions' ? doc : null,
      input: dialogKind === 'Snippets' ? doc.output : doc.input,
      example: false,
    });
    setDialogKind(null);
    notify(`${dialogKind === 'Sessions' ? 'Session' : 'Snippet'} saved for this session`);
  };

  return (
    <dialog
      className="wb-save-dialog"
      aria-labelledby="wb-save-title"
      ref={(node) => {
        openDialog(node);
        if (node?.open) node.querySelector('input')?.focus();
      }}
      onClose={() => setDialogKind(null)}
    >
      <form onSubmit={submit}>
        <div className="wb-dialog-title">
          <h2 id="wb-save-title">Save {dialogKind === 'Sessions' ? 'session' : 'snippet'}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="wb-icon-button"
            aria-label="Close save dialog"
            onClick={() => setDialogKind(null)}
          >
            <IconX size={22} />
          </Button>
        </div>
        <p>
          {dialogKind === 'Sessions'
            ? 'Keep this tool\u2019s input, result, and options together.'
            : 'Keep this result ready to reuse.'}
        </p>
        <Label className="flex flex-col gap-1.5 text-sm">
          Name
          <Input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              dialogKind === 'Sessions' ? 'e.g. Webhook inspection' : 'e.g. Invoice payload'
            }
          />
        </Label>
        <small>Saved in this session. Refreshing resets saved work.</small>
        <div className="wb-dialog-actions">
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            onClick={() => setDialogKind(null)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="default" className="wb-button primary">
            <IconBookmark size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
            Save {dialogKind === 'Sessions' ? 'session' : 'snippet'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
