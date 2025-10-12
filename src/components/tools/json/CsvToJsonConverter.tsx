import React, { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';



const CsvToJsonConverter: React.FC = () => {
  const [csv, setCsv] = useState('');
  const [json, setJson] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    Papa.parse(csv, {
      header: true,
      complete: (result: ParseResult<Record<string, string>[]>) => {
        setJson(JSON.stringify(result.data, null, 2));
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">CSV</h2>
        <Editor
          value={csv}
          onValueChange={setCsv}
          highlight={(code) => code} // No highlighting for CSV
          padding={10}
          placeholder="Enter CSV data"
          className={editorClassName}
        />
      </div>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">JSON</h2>
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
  );
};

export default CsvToJsonConverter;
