import React, { useState } from 'react';
import cssbeautify from 'cssbeautify';
import { minify } from 'csso';
import { Button } from '@/components/ui/button';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';


const CssFormatter: React.FC = () => {
  const [css, setCss] = useState('');
  const [formattedCss, setFormattedCss] = useState('');

  const handleFormat = () => {
    try {
      const formatted = cssbeautify(css, {
        indent: '  ',
        autosemicolon: true,
      });
      setFormattedCss(formatted);
    } catch (_error) {
      setFormattedCss('Invalid CSS input');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minify(css).css;
      setFormattedCss(minified);
    } catch (_error) {
      setFormattedCss('Invalid CSS input');
    }
  };

  const editorClassName = "flex-grow min-h-[20rem] font-mono text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">CSS</h2>
        <Editor
          value={css}
          onValueChange={setCss}
          highlight={(code) => Prism.highlight(code, Prism.languages.css, 'css')}
          padding={10}
          placeholder="Enter CSS data"
          className={editorClassName}
        />
      </div>
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">Output</h2>
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
      <div className="col-span-1 lg:col-span-2 flex gap-2">
        <Button onClick={handleFormat}>Format</Button>
        <Button onClick={handleMinify}>Minify</Button>
      </div>
    </div>
  );
};

export default CssFormatter;
