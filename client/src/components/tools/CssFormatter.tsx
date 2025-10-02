import React, { useState } from 'react';
import cssbeautify from 'cssbeautify';
import { minify } from 'csso';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">CSS</h2>
        <Textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          placeholder="Enter CSS data"
          className="min-h-[24rem]"
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Output</h2>
        <Textarea
          value={formattedCss}
          readOnly
          placeholder="Formatted/Minified CSS output"
          className="min-h-[24rem]"
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