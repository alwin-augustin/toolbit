import React, { useMemo, useState, useEffect, useRef } from 'react';
import { minify } from 'terser';
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

const JsJsonMinifier: React.FC = () => {
  const [code, setCode] = useState('');
  const [minifiedCode, setMinifiedCode] = useState('');
  const [valid, setValid] = useState<boolean | null>(null);
  const shareState = useMemo(() => ({ code }), [code]);
  useUrlState(shareState, (state) => {
    setCode(typeof state.code === 'string' ? state.code : '');
  });
  const { addEntry } = useToolHistory('js-json-minifier', 'JS/JSON Minifier');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);
  const setStatus = useEditorStatus((s) => s.setStatus);

  useEffect(() => {
    if (code) return;
    // Check for smart-paste data from AppHome
    const smartPaste = sessionStorage.getItem('toolbit:smart-paste');
    if (smartPaste) {
      sessionStorage.removeItem('toolbit:smart-paste');
      setCode(smartPaste.trim());
      return;
    }
    const workspaceState = consumeWorkspaceState('js-json-minifier');
    if (workspaceState) {
      try {
        const parsed = JSON.parse(workspaceState) as { input?: string; output?: string };
        setCode(parsed.input || '');
        setMinifiedCode(parsed.output || '');
      } catch {
        setCode(workspaceState);
      }
    }
  }, [code, consumeWorkspaceState]);

  const handleMinify = async () => {
    try {
      const result = await minify(code);
      setMinifiedCode(result.code || '');
      setValid(true);
      addEntry({ input: code, output: result.code || '', metadata: { action: 'minify' } });
    } catch (_error) {
      setMinifiedCode('Invalid JavaScript input');
      setValid(false);
    }
  };

  useEffect(() => {
    setStatus({
      valid,
      validityLabel: valid === null ? '' : valid ? 'Minified' : 'Invalid JavaScript',
    });
  }, [valid, setStatus]);

  return (
    <EditorSplit>
      <DropPanel onText={setCode}>
        <Panel>
          <PanelHeader
            title="JavaScript"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCode(
                      'function greet(name) {\n  const message = "Hello, " + name + "!";\n  return message;\n}\n',
                    )
                  }
                >
                  Load sample
                </Button>
                <Button size="sm" onClick={handleMinify}>
                  Minify
                </Button>
              </div>
            }
          />
          <CodeEditor
            value={code}
            onChange={setCode}
            reportStatus
            placeholder="Paste JavaScript or drop a file to minify."
          />
        </Panel>
      </DropPanel>
      <Panel>
        <PanelHeader
          title="Minified"
          badge={<ValidityBadge valid={valid} validLabel="minified" invalidLabel="invalid input" />}
          action={<CopyAction text={valid ? minifiedCode : ''} />}
        />
        {valid === false ? (
          <div
            style={{
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'hsl(var(--danger))',
            }}
          >
            {minifiedCode}
          </div>
        ) : (
          <CodeEditor value={minifiedCode} readOnly placeholder="Minified output" />
        )}
      </Panel>
    </EditorSplit>
  );
};

export default JsJsonMinifier;
