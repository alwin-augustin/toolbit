import { IconCopy, IconPlayerPlay, IconSparkles } from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export interface CaseResults {
  upper: string;
  lower: string;
  title: string;
  camel: string;
  pascal: string;
  snake: string;
  kebab: string;
  constant: string;
}

export const CASE_LABELS: Record<keyof CaseResults, string> = {
  upper: 'UPPER CASE',
  lower: 'lower case',
  title: 'Title Case',
  camel: 'camelCase',
  pascal: 'PascalCase',
  snake: 'snake_case',
  kebab: 'kebab-case',
  constant: 'CONSTANT_CASE',
};

export const CASE_SAMPLE = 'the quick brown fox jumps over the lazy dog';

const EMPTY_CASES: CaseResults = {
  upper: '',
  lower: '',
  title: '',
  camel: '',
  pascal: '',
  snake: '',
  kebab: '',
  constant: '',
};

// Regexes copied from the legacy CaseConverter.
export function convertCases(input: string): CaseResults {
  const text = input.trim();
  return {
    upper: text.toUpperCase(),
    lower: text.toLowerCase(),
    title: text.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    ),
    camel: text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase(),
      )
      .replace(/\s+/g, ''),
    pascal: text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, ''),
    snake: text.toLowerCase().replace(/\s+/g, '_'),
    kebab: text.toLowerCase().replace(/\s+/g, '-'),
    constant: text.toUpperCase().replace(/\s+/g, '_'),
  };
}

export function CaseScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [results, setResults] = useSessionDocumentState<CaseResults>('results', EMPTY_CASES);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Case Converter</h1>
          <p>Convert text between cases at once</p>
        </div>
      </div>
      <div className="wb-toolbar">
        <button
          type="button"
          className="wb-button primary"
          onClick={() => setResults(convertCases(input))}
          disabled={!input.trim()}
        >
          <IconPlayerPlay size={22} stroke={1.7} aria-hidden="true" />
          Convert
        </button>
        <button type="button" className="wb-button" onClick={() => setInput(CASE_SAMPLE)}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={() => setInput('')} disabled={!input}>
          Clear
        </button>
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Input panel">
          <div className="wb-pane-header">
            <h2>Input</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Input text"
            placeholder="Hello World Example"
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Results panel">
          <div className="wb-pane-header">
            <h2>Results</h2>
          </div>
          <div>
            {(Object.keys(CASE_LABELS) as (keyof CaseResults)[]).map((key) => (
              <div key={key} className="wb-setting-row">
                <span>
                  <strong>{CASE_LABELS[key]}</strong>
                  <small data-testid={`output-${key}`}>{results[key] || '—'}</small>
                </span>
                <button
                  type="button"
                  className="wb-icon-button"
                  aria-label={`Copy ${CASE_LABELS[key]}`}
                  disabled={!results[key]}
                  onClick={() => void copyText(results[key], CASE_LABELS[key])}
                >
                  <IconCopy size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="wb-pane-footer">
            <span>8 cases</span>
          </div>
        </section>
      </div>
    </>
  );
}
