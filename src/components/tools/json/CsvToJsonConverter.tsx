import React, { useState, useMemo, useEffect } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Button } from '@/components/ui/button';
import { Copy, FileJson } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { FileDropZone } from '@/components/FileDropZone';
import { ToolCard } from '@/components/ToolCard';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useWorkspace } from '@/hooks/use-workspace';



const CsvToJsonConverter: React.FC = () => {
  const [csv, setCsv] = useState('');
  const [json, setJson] = useState('');
  const [copied, setCopied] = useState(false);
  const shareState = useMemo(() => ({ csv }), [csv]);
  const { getShareUrl } = useUrlState(shareState, (state) => {
    setCsv(typeof state.csv === 'string' ? state.csv : '');
  });
  const { addEntry } = useToolHistory('csv-to-json', 'CSV to JSON');
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

  useEffect(() => {
    if (csv) return;
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
  }, [csv, consumeWorkspaceState]);

  const handleConvert = () => {
    Papa.parse(csv, {
      header: true,
      complete: (result: ParseResult<Record<string, string>[]>) => {
        const output = JSON.stringify(result.data, null, 2);
        setJson(output);
        addEntry({ input: csv, output, metadata: { action: 'convert' } });
      },
    });
  };

  const handleCopy = async () => {
    if (json) {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <ToolCard
      title="CSV to JSON Converter"
      description="Convert CSV data into JSON format"
      icon={<FileJson className="h-5 w-5" />}
      shareUrl={getShareUrl()}
      history={{
        toolId: 'csv-to-json',
        toolName: 'CSV to JSON',
        onRestore: (entry) => {
          setCsv(entry.input || '');
          setJson(entry.output || '');
        },
      }}
      pipeSource={{
        toolId: 'csv-to-json',
        output: json || '',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileDropZone onFileContent={setCsv} accept={[".csv", ".tsv", ".txt", "text/csv"]}>
        <div className="flex flex-col h-full">
          <label className="text-sm font-medium mb-2">CSV</label>
          <Editor
            value={csv}
            onValueChange={setCsv}
            highlight={(code) => code}
            padding={10}
            placeholder="Enter CSV data"
            className={editorClassName}
          />
        </div>
        </FileDropZone>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">JSON</label>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              disabled={!json}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <Editor
            value={json}
            onValueChange={() => {}}
            readOnly
            highlight={(code) => Prism.highlight(code, Prism.languages.json, 'json')}
            padding={10}
            placeholder="JSON output"
            className={editorClassName}
          />
        </div>
        <div className="col-span-1 lg:col-span-2">
          <Button onClick={handleConvert}>Convert</Button>
        </div>
      </div>
    </ToolCard>
  );
};

export default CsvToJsonConverter;
