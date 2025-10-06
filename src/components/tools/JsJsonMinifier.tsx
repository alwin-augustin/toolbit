import React, { useState } from 'react';
import { minify } from 'terser';
import { Button } from '@/components/ui/button';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';


const JsJsonMinifier: React.FC = () => {
  const [code, setCode] = useState('');
  const [minifiedCode, setMinifiedCode] = useState('');

  const handleMinify = async () => {
    try {
      const result = await minify(code);
      setMinifiedCode(result.code || '');
    } catch (_error) {
      setMinifiedCode('Invalid JavaScript input');
    }
  };

  const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">JavaScript</h2>
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={(code) => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
          padding={10}
          placeholder="Enter JavaScript"
          className={editorClassName}
        />
      </div>
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">Minified</h2>
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
  );
};

export default JsJsonMinifier;
