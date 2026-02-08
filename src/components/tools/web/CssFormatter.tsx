import React, { useMemo, useState, useEffect, useCallback } from 'react';
import cssbeautify from 'cssbeautify';
import { minify } from 'csso';
import { Button } from '@/components/ui/button';
import { Sparkles, Code, Loader2 } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import { FileDropZone } from '@/components/FileDropZone';
import { ToolCard } from '@/components/ToolCard';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useWorkspace } from '@/hooks/use-workspace';

const WORKER_THRESHOLD = 100_000; // 100KB



const CssFormatter: React.FC = () => {
  const [css, setCss] = useState('');
  const [formattedCss, setFormattedCss] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const shareState = useMemo(() => ({ css }), [css]);
  const { getShareUrl } = useUrlState(shareState, (state) => {
    setCss(typeof state.css === 'string' ? state.css : '');
  });
  const { addEntry } = useToolHistory('css-formatter', 'CSS Formatter');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

  useEffect(() => {
    if (css) return;
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

  const runWithWorker = useCallback((cssInput: string, action: "format" | "minify"): Promise<string> => {
    const worker = new Worker(new URL("../../../workers/css-worker.ts", import.meta.url), { type: "module" });
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => { worker.terminate(); reject(new Error("Timeout")); }, 30_000);
      worker.onmessage = (e: MessageEvent) => {
        window.clearTimeout(timeout); worker.terminate();
        if (e.data?.ok) resolve(e.data.result);
        else reject(new Error(e.data?.error || "Worker failed"));
      };
      worker.onerror = (e) => { window.clearTimeout(timeout); worker.terminate(); reject(new Error(e.message)); };
      worker.postMessage({ css: cssInput, action });
    });
  }, []);

  const processCSS = useCallback(async (action: "format" | "minify") => {
    setIsProcessing(true);
    try {
      let result: string;
      if (css.length > WORKER_THRESHOLD && "Worker" in window) {
        try {
          result = await runWithWorker(css, action);
        } catch {
          // Fallback to main thread
          result = action === "format"
            ? cssbeautify(css, { indent: '  ', autosemicolon: true })
            : minify(css).css;
        }
      } else {
        result = action === "format"
          ? cssbeautify(css, { indent: '  ', autosemicolon: true })
          : minify(css).css;
      }
      setFormattedCss(result);
      addEntry({ input: css, output: result, metadata: { action } });
    } catch {
      setFormattedCss('Invalid CSS input');
    }
    setIsProcessing(false);
  }, [css, addEntry, runWithWorker]);

  const handleFormat = () => processCSS("format");
  const handleMinify = () => processCSS("minify");

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
            highlight={(code) => Prism.highlight(code, Prism.languages.css, 'css')}
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
            highlight={(code) => Prism.highlight(code, Prism.languages.css, 'css')}
            padding={10}
            placeholder="Formatted/Minified CSS output"
            className={editorClassName}
          />
        </div>
        <div className="col-span-1 lg:col-span-2 flex gap-2 items-center">
          <Button onClick={handleFormat} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Format
          </Button>
          <Button onClick={handleMinify} disabled={isProcessing}>Minify</Button>
          <Button variant="ghost" size="sm" onClick={() => setCss('.container{display:flex;justify-content:center;align-items:center;gap:1rem;padding:2rem}.card{background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:1.5rem}')}>
            <Sparkles className="h-3 w-3 mr-1" />
            Sample
          </Button>
          {css.length > WORKER_THRESHOLD && <span className="text-xs text-muted-foreground">Large input — using background thread</span>}
        </div>
      </div>
    </ToolCard>
  );
};

export default CssFormatter;
