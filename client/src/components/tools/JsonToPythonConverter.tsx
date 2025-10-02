import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const JsonToPythonConverter: React.FC = () => {
  const [json, setJson] = useState('');
  const [python, setPython] = useState('');

  const handleConvert = () => {
    try {
      const pythonCode = json
        .replace(/true/g, 'True')
        .replace(/false/g, 'False')
        .replace(/null/g, 'None');
      setPython(pythonCode);
    } catch (_error) {
      setPython('Invalid JSON input');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">JSON</h2>
        <Textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder="Enter JSON data"
          className="min-h-[24rem]"
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Python</h2>
        <Textarea
          value={python}
          readOnly
          placeholder="Python output"
          className="min-h-[24rem]"
        />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <Button onClick={handleConvert}>Convert</Button>
      </div>
    </div>
  );
};

export default JsonToPythonConverter;