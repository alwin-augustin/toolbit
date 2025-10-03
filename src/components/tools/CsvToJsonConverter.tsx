import React, { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const CsvToJsonConverter: React.FC = () => {
  const [csv, setCsv] = useState('');
  const [json, setJson] = useState('');

  const handleConvert = () => {
    Papa.parse(csv, {
      header: true,
      complete: (result: ParseResult<Record<string, string>[]>) => {
        setJson(JSON.stringify(result.data, null, 2));
      },
    });
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
        <h2 className="text-lg font-semibold mb-2">JSON</h2>
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