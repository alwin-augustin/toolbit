import React, { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">CSV</h2>
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="Enter CSV data"
          className="min-h-[24rem]"
        />
      </div>
      <div>
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
        <Textarea
          value={json}
          readOnly
          placeholder="JSON output"
          className="min-h-[24rem]"
        />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <Button onClick={handleConvert}>Convert</Button>
      </div>
    </div>
  );
};

export default CsvToJsonConverter;