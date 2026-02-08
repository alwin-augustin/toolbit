import React, { useMemo, useState, useEffect } from 'react';
import cssbeautify from 'cssbeautify';
import { minify } from 'csso';
import { Button } from '@/components/ui/button';
import { Sparkles, Code } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { FileDropZone } from '@/components/FileDropZone';
import { ToolCard } from '@/components/ToolCard';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useWorkspace } from '@/hooks/use-workspace';



const CssFormatter: React.FC = () => {
  const [css, setCss] = useState('');
  const [formattedCss, setFormattedCss] = useState('');
  const [cssReady, setCssReady] = useState(false);
  const shareState = useMemo(() => ({ css }), [css]);
  const { getShareUrl } = useUrlState(shareState, (state) => {
    setCss(typeof state.css === 'string' ? state.css : '');
  });
  const { addEntry } = useToolHistory('css-formatter', 'CSS Formatter');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

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
  }, [css, consumeWorkspaceState]);

  useEffect(() => {
    let active = true;
    import('prismjs/components/prism-css')
      .then(() => {
        if (active) setCssReady(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleFormat = () => {
    try {
      const formatted = cssbeautify(css, {
        indent: '  ',
        autosemicolon: true,
      });
      setFormattedCss(formatted);
      addEntry({ input: css, output: formatted, metadata: { action: 'format' } });
    } catch (_error) {
      setFormattedCss('Invalid CSS input');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minify(css).css;
      setFormattedCss(minified);
      addEntry({ input: css, output: minified, metadata: { action: 'minify' } });
    } catch (_error) {
      setFormattedCss('Invalid CSS input');
    }
  };

  const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <ToolCard
      title="CSS Formatter / Minifier"
      description="Format and minify CSS code"
      icon={<Code className="h-5 w-5" />}
      shareUrl={getShareUrl()}
      history={{
        toolId: 'css-formatter',
        toolName: 'CSS Formatter',
        onRestore: (entry) => {
          setCss(entry.input || '');
          setFormattedCss(entry.output || '');
        },
      }}
      pipeSource={{
        toolId: 'css-formatter',
        output: formattedCss || '',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileDropZone onFileContent={setCss} accept={[".css", "text/css"]}>
        <div className="flex flex-col h-full">
          <label className="text-sm font-medium mb-2">CSS</label>
          <Editor
            value={css}
            onValueChange={setCss}
            highlight={(code) => (cssReady && Prism.languages.css ? Prism.highlight(code, Prism.languages.css, 'css') : code)}
            padding={10}
            placeholder="Enter CSS data"
            className={editorClassName}
          />
        </div>
        </FileDropZone>
        <div className="flex flex-col h-full">
          <label className="text-sm font-medium mb-2">Output</label>
          <Editor
            value={formattedCss}
            onValueChange={() => {}}
            readOnly
            highlight={(code) => (cssReady && Prism.languages.css ? Prism.highlight(code, Prism.languages.css, 'css') : code)}
            padding={10}
            placeholder="Formatted/Minified CSS output"
            className={editorClassName}
          />
        </div>
        <div className="col-span-1 lg:col-span-2 flex gap-2">
          <Button onClick={handleFormat}>Format</Button>
          <Button onClick={handleMinify}>Minify</Button>
          <Button variant="ghost" size="sm" onClick={() => setCss('.container{display:flex;justify-content:center;align-items:center;gap:1rem;padding:2rem}.card{background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:1.5rem}')}>
            <Sparkles className="h-3 w-3 mr-1" />
            Sample
          </Button>
        </div>
      </div>
    </ToolCard>
  );
};

export default CssFormatter;
