import { useDocumentField } from '@/v2/document-state';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Papa, { type ParseResult } from 'papaparse';
import { Upload } from 'lucide-react';
import { Button } from '@/ds/components';
import { CodeEditor } from '@/v2/CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '@/v2/EditorPanels';
import { useEditorStatus } from '@/v2/workspace-store';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useWorkspace } from '@/hooks/use-workspace';

/** Self-contained drop target: reads a dropped file as text. */
function DropPanel({
  onText,
  children,
}: {
  onText: (text: string) => void;
  children: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const counter = useRef(0);
  return (
    <div
      style={{ position: 'relative', display: 'grid', minHeight: 0 }}
      onDragEnter={(e) => {
        e.preventDefault();
        counter.current++;
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        counter.current--;
        if (counter.current === 0) setDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        counter.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (typeof ev.target?.result === 'string') onText(ev.target.result);
        };
        reader.readAsText(file);
      }}
    >
      {children}
      {dragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed hsl(var(--primary))',
            background: 'hsl(var(--primary) / 0.08)',
            color: 'hsl(var(--primary))',
            pointerEvents: 'none',
          }}
        >
          <Upload size={28} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Drop file here</span>
        </div>
      )}
    </div>
  );
}

const CsvToJsonConverter: React.FC = () => {
  const [csv, setCsv] = useDocumentField<string>('csv', '');
  const [json, setJson] = useState('');
  const [parseErrors, setParseErrors] = useState<number | null>(null);
  const shareState = useMemo(() => ({ csv }), [csv]);
  useUrlState(shareState, (state) => {
    setCsv(typeof state.csv === 'string' ? state.csv : '');
  });
  const { addEntry } = useToolHistory('csv-to-json', 'CSV to JSON');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);
  const setStatus = useEditorStatus((s) => s.setStatus);

  useEffect(() => {
    if (csv) return;
    // Check for smart-paste data from AppHome
    const smartPaste = sessionStorage.getItem('toolbit:smart-paste');
    if (smartPaste) {
      sessionStorage.removeItem('toolbit:smart-paste');
      setCsv(smartPaste.trim());
      return;
    }
    const workspaceState = consumeWorkspaceState('csv-to-json');
    if (workspaceState) {
      try {
        const parsed = JSON.parse(workspaceState) as { input?: string; output?: string };
        setCsv(parsed.input || '');
        setJson(parsed.output || '');
      } catch {
        setCsv(workspaceState);
      }
    }
  }, [csv, consumeWorkspaceState, setCsv]);

  const handleConvert = () => {
    Papa.parse(csv, {
      header: true,
      complete: (result: ParseResult<Record<string, string>[]>) => {
        const output = JSON.stringify(result.data, null, 2);
        setJson(output);
        setParseErrors(result.errors.length);
        addEntry({ input: csv, output, metadata: { action: 'convert' } });
      },
    });
  };

  const valid = parseErrors === null ? null : parseErrors === 0;

  useEffect(() => {
    setStatus({
      valid,
      validityLabel:
        valid === null
          ? ''
          : valid
            ? 'Converted'
            : `${parseErrors} parse warning${parseErrors === 1 ? '' : 's'}`,
    });
  }, [valid, parseErrors, setStatus]);

  return (
    <EditorSplit>
      <DropPanel onText={setCsv}>
        <Panel>
          <PanelHeader
            title="CSV"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCsv('name,role,active\nAlice,Engineer,true\nBob,Designer,false')
                  }
                >
                  Load sample
                </Button>
                <Button size="sm" onClick={handleConvert}>
                  Convert
                </Button>
              </div>
            }
          />
          <CodeEditor
            value={csv}
            onChange={setCsv}
            reportStatus
            placeholder="Paste CSV data or drop a file — the first row is used as column headers."
          />
        </Panel>
      </DropPanel>
      <Panel>
        <PanelHeader
          title="JSON"
          badge={
            <ValidityBadge valid={valid} validLabel="converted" invalidLabel="parse warnings" />
          }
          action={<CopyAction text={json} />}
        />
        <CodeEditor value={json} language="json" readOnly placeholder="JSON output" />
      </Panel>
    </EditorSplit>
  );
};

export default CsvToJsonConverter;
