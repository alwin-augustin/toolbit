import React, { useState } from 'react';
import { minify } from 'terser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const JsJsonMinifier: React.FC = () => {
  const [code, setCode] = useState('');
  const [minifiedCode, setMinifiedCode] = useState('');

  const handleMinify = async () => {
    try {
      const result = await minify(code);
      setMinifiedCode(result.code || '');
    } catch (_error) {
      setMinifiedCode('Invalid JavaScript/JSON input');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">JavaScript/JSON</h2>
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter JavaScript/JSON data"
          className="min-h-[24rem]"
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Minified</h2>
        <Textarea
          value={minifiedCode}
          readOnly
          placeholder="Minified output"
          className="min-h-[24rem]"
        />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <Button onClick={handleMinify}>Minify</Button>
      </div>
    </div>
  );
};

export default JsJsonMinifier;