import { useMemo } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type XmlMode = 'prettify' | 'minify' | 'json' | 'xpath' | 'validate';

export interface XmlOutcome {
  output: string;
  error: string;
  matchCount: number;
  valid: boolean | null;
}

export const XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title lang="en">Thinking, Fast and Slow</title>
    <author>Daniel Kahneman</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
  <book category="fiction">
    <title lang="fr">Le Petit Prince</title>
    <author>Antoine de Saint-Exupéry</author>
    <year>1943</year>
    <price>8.99</price>
  </book>
</bookstore>`;

// Hand-rolled prettifier copied from the legacy XmlFormatter.
export function prettifyXml(xml: string, indent = '  '): string {
  const lines: string[] = [];
  let depth = 0;
  // Remove existing whitespace between tags
  const cleaned = xml.replace(/>\s+</g, '><').trim();

  // Split into tokens: tags and text content
  const tokens = cleaned.match(/(<[^>]+>)|([^<]+)/g) || [];

  for (const token of tokens) {
    if (token.startsWith('</')) {
      // Closing tag
      depth--;
      lines.push(indent.repeat(Math.max(0, depth)) + token);
    } else if (token.startsWith('<?') || token.startsWith('<!')) {
      // Processing instruction or DOCTYPE
      lines.push(indent.repeat(depth) + token);
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      // Self-closing tag
      lines.push(indent.repeat(depth) + token);
    } else if (token.startsWith('<')) {
      // Opening tag
      lines.push(indent.repeat(depth) + token);
      depth++;
    } else {
      // Text content
      const text = token.trim();
      if (text) {
        // Inline text with previous opening tag
        const lastLine = lines[lines.length - 1];
        if (
          lastLine &&
          lastLine.trimStart().startsWith('<') &&
          !lastLine.trimStart().startsWith('</')
        ) {
          lines[lines.length - 1] = lastLine + text;
          depth--; // text will be followed by closing tag at same level
        } else {
          lines.push(indent.repeat(depth) + text);
        }
      }
    }
  }

  return lines.join('\n');
}

export function minifyXml(xml: string): string {
  return xml
    .replace(/>\s+</g, '><')
    .replace(/\s*\n\s*/g, '')
    .trim();
}

export function xmlToJson(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + parseError.textContent);
  }

  function nodeToObj(node: Element): Record<string, unknown> {
    const obj: Record<string, unknown> = {};

    // Attributes
    if (node.attributes.length > 0) {
      const attrs: Record<string, string> = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        attrs['@' + attr.name] = attr.value;
      }
      Object.assign(obj, attrs);
    }

    // Child nodes
    const children = Array.from(node.childNodes);
    const textOnly = children.every(
      (c) => c.nodeType === Node.TEXT_NODE || c.nodeType === Node.CDATA_SECTION_NODE,
    );

    if (textOnly) {
      const text = node.textContent?.trim() || '';
      if (Object.keys(obj).length > 0) {
        if (text) obj['#text'] = text;
      } else {
        return text as unknown as Record<string, unknown>;
      }
    } else {
      const childMap: Record<string, unknown[]> = {};
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childObj = nodeToObj(child as Element);
          const name = child.nodeName;
          if (!childMap[name]) childMap[name] = [];
          childMap[name].push(childObj);
        }
      }
      for (const [key, val] of Object.entries(childMap)) {
        obj[key] = val.length === 1 ? val[0] : val;
      }
    }

    return obj;
  }

  const root = doc.documentElement;
  const result = { [root.nodeName]: nodeToObj(root) };
  return JSON.stringify(result, null, 2);
}

export function queryXPath(xml: string, xpath: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML');
  }

  const results: string[] = [];
  try {
    const xpathResult = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
    let node = xpathResult.iterateNext();
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        results.push(new XMLSerializer().serializeToString(node));
      } else {
        results.push(node.textContent || '');
      }
      node = xpathResult.iterateNext();
    }
  } catch (e) {
    throw new Error('Invalid XPath: ' + (e as Error).message, { cause: e });
  }

  return results;
}

export function validateXml(xml: string): { valid: boolean; error?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { valid: false, error: parseError.textContent || 'Invalid XML' };
  }
  return { valid: true };
}

/** Single entry point for the screen and tests. Empty input yields empty output. */
export function runXml(input: string, mode: XmlMode, xpath = ''): XmlOutcome {
  const empty: XmlOutcome = { output: '', error: '', matchCount: 0, valid: null };
  if (!input.trim()) return empty;
  try {
    if (mode === 'prettify' || mode === 'minify') {
      const validation = validateXml(input);
      if (!validation.valid) {
        return {
          output: '',
          error: validation.error || 'Invalid XML',
          matchCount: 0,
          valid: false,
        };
      }
      const output = mode === 'prettify' ? prettifyXml(input) : minifyXml(input);
      return { output, error: '', matchCount: 0, valid: true };
    }
    if (mode === 'json') {
      const output = xmlToJson(input);
      return { output, error: '', matchCount: 0, valid: true };
    }
    if (mode === 'xpath') {
      if (!xpath.trim()) return empty;
      const results = queryXPath(input, xpath);
      if (results.length === 0) {
        return { output: '', error: 'No matches found', matchCount: 0, valid: true };
      }
      return { output: results.join('\n'), error: '', matchCount: results.length, valid: true };
    }
    const validation = validateXml(input);
    if (validation.valid) {
      return { output: 'XML is valid', error: '', matchCount: 0, valid: true };
    }
    return {
      output: '',
      error: validation.error || 'Invalid XML',
      matchCount: 0,
      valid: false,
    };
  } catch (e) {
    return {
      output: '',
      error: e instanceof Error ? e.message : 'Invalid XML',
      matchCount: 0,
      valid: false,
    };
  }
}

const MODES: { value: XmlMode; label: string }[] = [
  { value: 'prettify', label: 'Prettify' },
  { value: 'minify', label: 'Minify' },
  { value: 'json', label: 'XML to JSON' },
  { value: 'xpath', label: 'XPath' },
  { value: 'validate', label: 'Validate' },
];

export function XmlScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [mode, setMode] = useSessionDocumentState<XmlMode>('mode', 'prettify');
  const [xpathQuery, setXpathQuery] = useDocumentField<string>('xpathQuery', '');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo(() => runXml(input, mode, xpathQuery), [input, mode, xpathQuery]);

  const loadSample = () => {
    setInput(XML_SAMPLE);
  };

  const copyOutput = async () => {
    if (!outcome.output) return;
    try {
      await navigator.clipboard.writeText(outcome.output);
      notify('Output copied');
    } catch {
      notify('Clipboard unavailable. Select the output and copy it.');
    }
  };

  const resultTitle =
    mode === 'xpath'
      ? `Results${outcome.matchCount > 0 ? ` (${outcome.matchCount})` : ''}`
      : mode === 'json'
        ? 'JSON'
        : mode === 'validate'
          ? 'Validation'
          : 'Output';

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>XML</h1>
          <p>Format and query XML</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <ToggleGroup
          value={[mode]}
          onValueChange={(v) =>
            setMode((v[0] ?? MODES[0].value) as (typeof MODES)[number]['value'])
          }
          variant="outline"
        >
          {MODES.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value}>
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <button type="button" className="wb-button" onClick={loadSample}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={() => setInput('')} disabled={!input}>
          Clear
        </button>
      </div>
      {mode === 'xpath' ? (
        <div className="wb-setting-row">
          <span>
            <strong>XPath query</strong>
            <small>Evaluated against the input document.</small>
          </span>
          <input
            aria-label="XPath query"
            value={xpathQuery}
            onChange={(e) => setXpathQuery(e.target.value)}
            placeholder="//book[@category='fiction']/title"
          />
        </div>
      ) : null}
      {outcome.error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{outcome.error}</span>
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Input panel">
          <div className="wb-pane-header">
            <h2>Input</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Input XML"
            placeholder="Paste your XML here..."
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Result panel">
          <div className="wb-pane-header">
            <h2>{resultTitle}</h2>
            <div className="wb-copy-actions">
              <button
                type="button"
                className="wb-button primary"
                disabled={!outcome.output}
                onClick={() => void copyOutput()}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
          <CodeEditor
            value={outcome.error ? '' : outcome.output}
            readOnly
            wrap={wrap}
            label="XML result"
            language={mode === 'json' ? 'json' : 'text'}
            placeholder={
              mode === 'xpath' ? 'XPath matches will appear here.' : 'Output will appear here...'
            }
          />
          <div className="wb-pane-footer">
            <span>
              {mode === 'xpath' && outcome.matchCount > 0
                ? `${outcome.matchCount} match${outcome.matchCount === 1 ? '' : 'es'}`
                : outcome.valid === true
                  ? 'Valid XML'
                  : outcome.valid === false
                    ? 'Invalid XML'
                    : 'Waiting for input'}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
