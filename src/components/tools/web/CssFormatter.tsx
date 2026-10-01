import { useDocumentField } from "@/v2/document-state";
import React, { useMemo, useState, useEffect } from 'react';
import cssbeautify from 'cssbeautify';
import { minify } from 'csso';
import { Sparkles } from 'lucide-react';
import { Button } from '@/ds/components';
import { CodeEditor } from '@/v2/CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '@/v2/EditorPanels';
import { useEditorStatus } from '@/v2/workspace-store';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useWorkspace } from '@/hooks/use-workspace';

const SAMPLE_CSS = '.container{display:flex;justify-content:center;align-items:center;gap:1rem;padding:2rem}.card{background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:1.5rem}';

const CssFormatter: React.FC = () => {
  const [css, setCss] = useDocumentField<string>("css", '');
  const [formattedCss, setFormattedCss] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const shareState = useMemo(() => ({ css }), [css]);
  useUrlState(shareState, (state) => {
    setCss(typeof state.css === 'string' ? state.css : '');
  });
  const { addEntry } = useToolHistory('css-formatter', 'CSS Formatter');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);
  const setStatus = useEditorStatus((s) => s.setStatus);

  useEffect(() => {
    if (css) return;
    // Check for smart-paste data from AppHome
    const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
    if (smartPaste) {
        sessionStorage.removeItem("toolbit:smart-paste");
        setCss(smartPaste.trim());
        return;
    }
    const workspaceState = consumeWorkspaceState('css-formatter');
    if (workspaceState) {
      try {
        const parsed = JSON.parse(workspaceState) as { input?: string; output?: string };
        setCss(parsed.input || '');
        setFormattedCss(parsed.output || '');
      } catch {
        setCss(workspaceState);
      }
    }
  }, [css, consumeWorkspaceState, setCss]);

  const handleFormat = () => {
    try {
      const formatted = cssbeautify(css, {
        indent: '  ',
        autosemicolon: true,
      });
      setFormattedCss(formatted);
      setIsValid(true);
      addEntry({ input: css, output: formatted, metadata: { action: 'format' } });
    } catch (_error) {
      setFormattedCss('Invalid CSS input');
      setIsValid(false);
    }
  };

  const handleMinify = () => {
    try {
      const minified = minify(css).css;
      setFormattedCss(minified);
      setIsValid(true);
      addEntry({ input: css, output: minified, metadata: { action: 'minify' } });
    } catch (_error) {
      setFormattedCss('Invalid CSS input');
      setIsValid(false);
    }
  };

  useEffect(() => {
    setStatus({
      valid: isValid,
      validityLabel: isValid === null ? '' : isValid ? 'Valid CSS' : 'Invalid CSS',
    });
  }, [isValid, setStatus]);

  return (
    <EditorSplit>
      <Panel>
        <PanelHeader
          title="CSS"
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <Button size="sm" onClick={handleFormat}>
                Format
              </Button>
              <Button variant="secondary" size="sm" onClick={handleMinify}>
                Minify
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<Sparkles size={14} />}
                onClick={() => setCss(SAMPLE_CSS)}
              >
                Load sample
              </Button>
            </div>
          }
        />
        <CodeEditor
          value={css}
          onChange={setCss}
          language="text"
          reportStatus
          placeholder="Enter CSS data"
        />
      </Panel>
      <Panel>
        <PanelHeader
          title="Output"
          badge={<ValidityBadge valid={isValid} validLabel="valid CSS" invalidLabel="invalid CSS" />}
          action={<CopyAction text={isValid ? formattedCss : ''} />}
        />
        {isValid === false ? (
          <div
            style={{
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'hsl(var(--danger))',
            }}
          >
            {formattedCss}
          </div>
        ) : (
          <CodeEditor
            value={formattedCss}
            language="text"
            readOnly
            placeholder="Formatted/Minified CSS output"
          />
        )}
      </Panel>
    </EditorSplit>
  );
};

export default CssFormatter;
