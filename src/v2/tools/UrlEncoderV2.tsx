import { useDocumentField, useDocumentOptions } from '../document-state';
import { useEffect, useMemo } from 'react';
import { Button, Badge, Tabs, Checkbox } from '@/ds/components';
import { CodeEditor } from '../CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '../EditorPanels';
import { registerInspectorPanel } from '../Inspector';
import { useEditorStatus } from '../workspace-store';
import { useSmartPasteInput } from '../smart-paste';
import { useToolHistory } from '@/hooks/use-tool-history';

type Mode = 'encode' | 'decode';

function useUrlOptions() {
  return useDocumentOptions({ mode: 'encode' as Mode, componentMode: true as boolean });
}

function UrlInspectorPanel() {
  const { mode, componentMode, set } = useUrlOptions();
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
          onChange={(v) => set({ mode: v as Mode })}
          items={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
          ]}
        />
      </div>
      <Checkbox
        checked={componentMode}
        onChange={(v) => set({ componentMode: v })}
        label="Component mode (encode &, =, / too)"
      />
    </>
  );
}

registerInspectorPanel('url-encoder', UrlInspectorPanel);

const SAMPLE_ENCODE = 'https://toolbit.app/search?q=local first&lang=en';
const SAMPLE_DECODE = 'https%3A%2F%2Ftoolbit.app%2Fsearch%3Fq%3Dlocal%20first%26lang%3Den';

export default function UrlEncoderV2() {
  const [input, setInput] = useDocumentField<string>('input', '');
  useSmartPasteInput(setInput);
  const { mode, componentMode } = useUrlOptions();
  const setStatus = useEditorStatus((s) => s.setStatus);
  const { addEntry } = useToolHistory('url-encoder', 'URL Encoder');

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', valid: null as boolean | null };
    try {
      const output =
        mode === 'encode'
          ? componentMode
            ? encodeURIComponent(input)
            : encodeURI(input)
          : componentMode
            ? decodeURIComponent(input)
            : decodeURI(input);
      return { output, valid: true as boolean | null };
    } catch (e) {
      return {
        output: e instanceof Error ? e.message : 'Malformed URI sequence',
        valid: false as boolean | null,
      };
    }
  }, [input, mode, componentMode]);

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
            : 'Malformed URI',
    });
  }, [result.valid, mode, setStatus]);

  useEffect(() => {
    if (result.valid !== true || !input.trim()) return;
    const t = setTimeout(
      () => addEntry({ input, output: result.output, metadata: { mode, componentMode } }),
      1500,
    );
    return () => clearTimeout(t);
  }, [input, result.output, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <EditorSplit toolId="url-encoder" output={result.valid ? result.output : ''}>
      <Panel>
        <PanelHeader
          title={mode === 'encode' ? 'Plain URL / text' : 'Encoded URL'}
          badge={input.trim() ? <Badge tone="primary">detected URL</Badge> : undefined}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput(mode === 'encode' ? SAMPLE_ENCODE : SAMPLE_DECODE)}
            >
              Load sample
            </Button>
          }
        />
        <CodeEditor
          value={input}
          onChange={setInput}
          reportStatus
          placeholder={
            mode === 'encode'
              ? 'Type or paste a URL or text to encode…'
              : 'Paste an encoded URL to decode…'
          }
        />
      </Panel>
      <Panel>
        <PanelHeader
          title={mode === 'encode' ? 'Encoded' : 'Decoded'}
          badge={
            <ValidityBadge
              valid={result.valid}
              validLabel={mode === 'encode' ? 'encoded' : 'decoded'}
              invalidLabel="malformed"
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
