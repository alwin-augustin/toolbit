import { useCanonicalTransform } from '../use-canonical-transform';

import { useDocumentField, useDocumentOptions } from '../document-state';
import { safeStorage } from '@/lib/preferences';
import { useEffect } from 'react';
import { Button, Badge, Select, Checkbox } from '@/ds/components';
import { CodeEditor } from '../CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '../EditorPanels';
import { registerInspectorPanel } from '../Inspector';
import { useEditorStatus } from '../workspace-store';
import { useSmartPasteInput } from '../smart-paste';
import { useToolHistory } from '@/hooks/use-tool-history';

const SAMPLE = `{"workspace":"API Debug","tools":["JSON","JWT","Base64"],"density":"comfortable","localFirst":true,"tabs":3}`;

function useJsonOptions() {
  const defaults = { indent: 2, sortKeys: false, validateWhileTyping: true };
  let legacy = {};
  try {
    legacy = JSON.parse(safeStorage.getItem('toolbit-v2-json-options') || '{}').state || {};
  } catch {
    /* defaults */
  }
  return useDocumentOptions({ ...defaults, ...legacy } as typeof defaults);
}

function JsonInspectorPanel() {
  const { indent, sortKeys, validateWhileTyping, set } = useJsonOptions();
  return (
    <>
      <div style={{ display: 'grid', gap: 6 }}>
        <label
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'hsl(var(--text-body))' }}
        >
          Indent
        </label>
        <Select
          aria-label="Indent"
          fullWidth
          value={String(indent)}
          onChange={(e) => set({ indent: Number(e.target.value) })}
        >
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="8">8 spaces</option>
        </Select>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Checkbox checked={sortKeys} onChange={(v) => set({ sortKeys: v })} label="Sort keys" />
        <Checkbox
          checked={validateWhileTyping}
          onChange={(v) => set({ validateWhileTyping: v })}
          label="Validate while typing"
        />
      </div>
    </>
  );
}

registerInspectorPanel('json-formatter', JsonInspectorPanel);

export default function JsonFormatterV2() {
  const [input, setInput] = useDocumentField<string>('input', '');
  useSmartPasteInput(setInput);
  const [committedInput, setCommittedInput] = useDocumentField<string>('committedInput', '');
  const { indent, sortKeys, validateWhileTyping } = useJsonOptions();
  const setStatus = useEditorStatus((s) => s.setStatus);
  const { addEntry } = useToolHistory('json-formatter', 'JSON Formatter');

  const [lastValid, setLastValid] = useDocumentField<string>('lastValid', '');
  const source = validateWhileTyping ? input : committedInput;

  const result = useCanonicalTransform('json-formatter', source, {
    indent,
    sortKeys,
    validateWhileTyping,
  });

  useEffect(() => {
    if (result.valid) setLastValid(result.output);
  }, [result.valid, result.output, setLastValid]);

  useEffect(() => {
    setStatus({
      valid: result.valid,
      validityLabel: result.valid === null ? '' : result.valid ? 'Valid JSON' : 'Invalid JSON',
    });
  }, [result.valid, setStatus]);

  // Record successful formats in local history (debounced).
  useEffect(() => {
    if (result.valid !== true || !source.trim()) return;
    const t = setTimeout(() => addEntry({ input: source, output: result.output }), 1500);
    return () => clearTimeout(t);
  }, [source, result.output, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <EditorSplit toolId="json-formatter" output={result.valid ? result.output : ''}>
      <Panel>
        <PanelHeader
          title="Input"
          badge={input.trim() ? <Badge tone="primary">detected JSON</Badge> : undefined}
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              {!validateWhileTyping && (
                <Button variant="secondary" size="sm" onClick={() => setCommittedInput(input)}>
                  Format
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const pretty = JSON.stringify(JSON.parse(SAMPLE), null, 2);
                  setInput(pretty);
                  setCommittedInput(pretty);
                }}
              >
                Load sample
              </Button>
            </div>
          }
        />
        {result.busy && (
          <p role="status">
            Processing… <button onClick={result.cancel}>Cancel processing</button>
          </p>
        )}
        <CodeEditor
          value={input}
          onChange={setInput}
          language="json"
          reportStatus
          placeholder="Paste JSON here — or ⌘V anywhere and Toolbit detects the tool."
        />
      </Panel>
      <Panel>
        <PanelHeader
          title={result.busy ? 'Output · processing…' : 'Output'}
          badge={
            <ValidityBadge
              valid={result.valid}
              validLabel="valid object"
              invalidLabel="parse error"
            />
          }
          action={<CopyAction text={result.valid ? result.output : ''} />}
        />
        {result.valid === false ? (
          <div
            style={{
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'hsl(var(--danger))',
            }}
          >
            <span role="alert">{result.output}</span>
            {lastValid && (
              <CodeEditor
                value={lastValid}
                language="json"
                readOnly
                label="Previous valid output"
              />
            )}
          </div>
        ) : (
          <>
            <p role="status">{result.warning}</p>
            <CodeEditor value={result.output} language="json" readOnly />
          </>
        )}
      </Panel>
    </EditorSplit>
  );
}
