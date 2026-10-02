import { useCanonicalTransform } from '../use-canonical-transform';

import { useDocumentField, useDocumentOptions } from '../document-state';
import { safeStorage } from '@/lib/preferences';
import { useEffect } from 'react';
import { Button, Badge, Checkbox, Tabs } from '@/ds/components';
import { CodeEditor } from '../CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '../EditorPanels';
import { registerInspectorPanel } from '../Inspector';
import { useEditorStatus } from '../workspace-store';
import { useSmartPasteInput } from '../smart-paste';
import { useToolHistory } from '@/hooks/use-tool-history';

function useBase64Options() {
  const defaults = { mode: 'encode', urlSafe: false };
  let legacy = {};
  try {
    legacy = JSON.parse(safeStorage.getItem('toolbit-v2-base64-options') || '{}').state || {};
  } catch {
    /* defaults */
  }
  return useDocumentOptions({ ...defaults, ...legacy } as typeof defaults);
}

function Base64InspectorPanel() {
  const { mode, urlSafe, set } = useBase64Options();
  return (
    <>
      <div style={{ display: 'grid', gap: 6 }}>
        <label
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'hsl(var(--text-body))' }}
        >
          Mode
        </label>
        <Tabs
          variant="segment"
          value={mode}
          onChange={(v) => set({ mode: v })}
          items={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
          ]}
        />
      </div>
      <Checkbox
        checked={urlSafe}
        onChange={(v) => set({ urlSafe: v })}
        label="URL-safe variant (-_ instead of +/)"
      />
    </>
  );
}

registerInspectorPanel('base64-encoder', Base64InspectorPanel);

export default function Base64EncoderV2() {
  const [input, setInput] = useDocumentField<string>('input', '');
  useSmartPasteInput(setInput);
  const { mode, urlSafe } = useBase64Options();
  const setStatus = useEditorStatus((s) => s.setStatus);
  const { addEntry } = useToolHistory('base64-encoder', 'Base64 Encoder');

  const result = useCanonicalTransform('base64-encoder', input, { mode, urlSafe });

  useEffect(() => {
    setStatus({
      valid: result.valid,
      validityLabel:
        result.valid === null
          ? ''
          : result.valid
            ? mode === 'encode'
              ? 'Encoded'
              : 'Decoded'
            : 'Invalid Base64',
    });
  }, [result.valid, mode, setStatus]);

  useEffect(() => {
    if (result.valid !== true || !input.trim()) return;
    const t = setTimeout(
      () => addEntry({ input, output: result.output, metadata: { mode, urlSafe } }),
      1500,
    );
    return () => clearTimeout(t);
  }, [input, result.output, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <EditorSplit toolId="base64-encoder" output={result.valid ? result.output : ''}>
      <Panel>
        <PanelHeader
          title={mode === 'encode' ? 'Plain text' : 'Base64'}
          badge={
            input.trim() && mode === 'decode' ? (
              <Badge tone="primary">detected Base64</Badge>
            ) : undefined
          }
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setInput(
                  mode === 'encode'
                    ? 'Local-first developer tools — privacy by default.'
                    : 'TG9jYWwtZmlyc3QgZGV2ZWxvcGVyIHRvb2xzIOKAlCBwcml2YWN5IGJ5IGRlZmF1bHQu',
                )
              }
            >
              Load sample
            </Button>
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
          reportStatus
          placeholder={
            mode === 'encode' ? 'Type or paste text to encode…' : 'Paste Base64 to decode…'
          }
        />
      </Panel>
      <Panel>
        <PanelHeader
          title={mode === 'encode' ? 'Base64' : 'Plain text'}
          badge={
            <ValidityBadge
              valid={result.valid}
              validLabel={mode === 'encode' ? 'encoded' : 'decoded'}
              invalidLabel="invalid input"
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
            {result.output}
          </div>
        ) : (
          <CodeEditor value={result.output} readOnly />
        )}
      </Panel>
    </EditorSplit>
  );
}
