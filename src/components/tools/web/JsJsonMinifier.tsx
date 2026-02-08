import React, { useMemo, useState, useEffect } from 'react';
import { minify } from 'terser';
import { Button } from '@/components/ui/button';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import { FileDropZone } from '@/components/FileDropZone';
import { ToolCard } from '@/components/ToolCard';
import { useUrlState } from '@/hooks/use-url-state';
import { Code } from 'lucide-react';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useWorkspace } from '@/hooks/use-workspace';



const JsJsonMinifier: React.FC = () => {
  const [code, setCode] = useState('');
  const [minifiedCode, setMinifiedCode] = useState('');
  const shareState = useMemo(() => ({ code }), [code]);
  const { getShareUrl } = useUrlState(shareState, (state) => {
    setCode(typeof state.code === 'string' ? state.code : '');
  });
  const { addEntry } = useToolHistory('js-json-minifier', 'JS/JSON Minifier');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

  useEffect(() => {
    if (code) return;
    // Check for smart-paste data from AppHome
    const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
    if (smartPaste) {
        sessionStorage.removeItem("toolbit:smart-paste");
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
      addEntry({ input: code, output: result.code || '', metadata: { action: 'minify' } });
    } catch (_error) {
      setMinifiedCode('Invalid JavaScript input');
    }
  };

  const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <ToolCard
      title="JS/JSON Minifier"
      description="Minify JavaScript code"
      icon={<Code className="h-5 w-5" />}
      shareUrl={getShareUrl()}
      history={{
        toolId: 'js-json-minifier',
        toolName: 'JS/JSON Minifier',
        onRestore: (entry) => {
          setCode(entry.input || '');
          setMinifiedCode(entry.output || '');
        },
      }}
      pipeSource={{
        toolId: 'js-json-minifier',
        output: minifiedCode || '',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileDropZone onFileContent={setCode} accept={[".js", ".ts", ".jsx", ".tsx", "text/javascript"]}>
        <div className="flex flex-col h-full">
          <label className="text-sm font-medium mb-2">JavaScript</label>
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
            padding={10}
            placeholder="Enter JavaScript"
            className={editorClassName}
          />
        </div>
        </FileDropZone>
        <div className="flex flex-col h-full">
          <label className="text-sm font-medium mb-2">Minified</label>
          <Editor
            value={minifiedCode}
            onValueChange={() => {}}
            readOnly
            highlight={(code) => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
            padding={10}
            placeholder="Minified output"
            className={editorClassName}
          />
        </div>
        <div className="col-span-1 lg:col-span-2">
          <Button onClick={handleMinify}>Minify</Button>
        </div>
      </div>
    </ToolCard>
  );
};

export default JsJsonMinifier;
