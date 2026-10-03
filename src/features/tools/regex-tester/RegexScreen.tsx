import { useMemo } from 'react';
import { IconCopy, IconEraser, IconRegex, IconSparkles } from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export interface RegexMatch {
  fullMatch: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

export interface RegexEvaluation {
  matches: RegexMatch[];
  error: string | null;
}

const MAX_MATCHES = 1000;
const MAX_REGEX_TEXT = 200_000;
const MAX_REGEX_PATTERN = 5_000;
const REGEX_TIME_BUDGET_MS = 200;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid pattern';
}

function isValidFlags(flags: string): boolean {
  return /^[gimsuy]*$/.test(flags);
}

/** Sync port of the legacy regex-evaluate worker (same match shape). */
export function findRegexMatches(pattern: string, flags: string, text: string): RegexEvaluation {
  if (!pattern) return { matches: [], error: null };
  if (pattern.length > MAX_REGEX_PATTERN)
    return { matches: [], error: `Pattern too long (max ${MAX_REGEX_PATTERN} characters).` };
  if (text.length > MAX_REGEX_TEXT)
    return { matches: [], error: `Test text too large (max ${MAX_REGEX_TEXT} characters).` };
  if (!isValidFlags(flags))
    return { matches: [], error: 'Invalid flags. Use only g, i, m, s, u, y.' };
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (error) {
    return { matches: [], error: toErrorMessage(error) };
  }
  const matches: RegexMatch[] = [];
  const started = Date.now();
  try {
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null && matches.length < MAX_MATCHES) {
      matches.push({
        fullMatch: match[0],
        index: match.index,
        groups: Array.from(match.slice(1), (g) => g ?? ''),
        namedGroups: { ...(match.groups ?? {}) },
      });
      if (Date.now() - started > REGEX_TIME_BUDGET_MS)
        return { matches, error: 'Evaluation budget exceeded — narrow the pattern or text.' };
      if (!flags.includes('g')) break;
      if (match[0].length === 0) re.lastIndex += 1;
    }
  } catch (error) {
    return { matches: [], error: toErrorMessage(error) };
  }
  return { matches, error: null };
}

export interface RegexReplaceResult {
  result: string;
  error: string | null;
}

export function applyRegexReplace(
  pattern: string,
  flags: string,
  text: string,
  replacement: string,
): RegexReplaceResult {
  if (!pattern) return { result: '', error: null };
  if (pattern.length > MAX_REGEX_PATTERN || text.length > MAX_REGEX_TEXT)
    return { result: '', error: 'Input exceeds evaluation budget.' };
  if (!isValidFlags(flags)) return { result: '', error: 'Invalid flags.' };
  try {
    return { result: text.replace(new RegExp(pattern, flags), replacement), error: null };
  } catch (error) {
    return { result: '', error: toErrorMessage(error) };
  }
}

export function describeGroups(match: RegexMatch): string {
  const parts = match.groups.map((g, i) => `$${i + 1}: ${g}`);
  for (const [name, value] of Object.entries(match.namedGroups)) {
    parts.push(`${name}: ${value}`);
  }
  return parts.length ? parts.join(', ') : 'No groups';
}

const SAMPLE_PATTERN = '(\\w+)@([\\w.]+)';
const SAMPLE_FLAGS = 'g';
const SAMPLE_TEXT =
  'Contact us at support@toolbit.dev or sales@example.com for help.\nAlso try admin@test.org';

export function RegexScreen() {
  const [pattern, setPattern] = useDocumentField<string>('pattern', '');
  const [flags, setFlags] = useDocumentField<string>('flags', 'g');
  const [testString, setTestString] = useDocumentField<string>('testString', '');
  const [replacement, setReplacement] = useDocumentField<string>('replacement', '');
  const [showReplace, setShowReplace] = useSessionDocumentState('showReplace', true);
  const notify = useWorkbenchMemory((s) => s.notify);
  const wrap = useWorkbenchMemory((s) => s.wrap);

  const { matches, error } = useMemo(
    () => findRegexMatches(pattern, flags, testString),
    [pattern, flags, testString],
  );
  const replacePreview = useMemo(() => {
    if (!showReplace) return { result: '', error: null };
    return applyRegexReplace(pattern, flags, testString, replacement);
  }, [showReplace, pattern, flags, testString, replacement]);

  const loadSample = () => {
    setPattern(SAMPLE_PATTERN);
    setFlags(SAMPLE_FLAGS);
    setTestString(SAMPLE_TEXT);
  };
  const clear = () => {
    setPattern('');
    setTestString('');
    setReplacement('');
  };
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the text and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Regex</h1>
          <p>Test regular expressions</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconRegex size={18} />
            {matches.length} match{matches.length === 1 ? '' : 'es'}
          </span>
          {error ? <span>Invalid pattern</span> : <span>JavaScript RegExp</span>}
        </div>
      </div>

      <div className="wb-toolbar">
        <button type="button" className="wb-button" onClick={loadSample}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={clear}>
          <IconEraser size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </button>
        <button
          type="button"
          className={`wb-button${showReplace ? ' primary' : ''}`}
          onClick={() => setShowReplace(!showReplace)}
          aria-expanded={showReplace}
        >
          Replace preview
        </button>
      </div>

      {error && (
        <div className="wb-error-banner" role="alert">
          <strong>Invalid pattern.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="wb-setting-row">
        <span>
          <strong>Pattern</strong>
          <small>JavaScript RegExp syntax, without the slashes.</small>
        </span>
        <input
          aria-label="Pattern"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Enter regex pattern..."
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Flags</strong>
          <small>Common flags: g global, i case-insensitive, m multiline, s dotall.</small>
        </span>
        <input
          aria-label="Flags"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="g"
        />
      </div>
      {showReplace && (
        <div className="wb-setting-row">
          <span>
            <strong>Replacement</strong>
            <small>Supports $1, $2 and named references.</small>
          </span>
          <input
            aria-label="Replacement"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replacement string (supports $1, $2, etc.)"
          />
        </div>
      )}

      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Test text panel">
          <div className="wb-pane-header">
            <h2>Test text</h2>
            <button
              type="button"
              className="wb-button quiet wb-clear"
              onClick={() => setTestString('')}
            >
              Clear
            </button>
          </div>
          <CodeEditor
            value={testString}
            onChange={setTestString}
            wrap={wrap}
            label="Test text"
            placeholder="Enter test string..."
          />
          <div className="wb-pane-footer">
            <span>{testString.length} characters</span>
            <span className="wb-file-type">Text</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Replace preview panel">
          <div className="wb-pane-header">
            <h2>Replace preview</h2>
            <button
              type="button"
              className="wb-button quiet wb-clear"
              disabled={!replacePreview.result}
              onClick={() => copy(replacePreview.result, 'Preview')}
            >
              <IconCopy size={18} aria-hidden="true" />
              Copy
            </button>
          </div>
          <CodeEditor
            value={replacePreview.error ?? replacePreview.result}
            readOnly
            wrap={wrap}
            label="Replace preview"
            placeholder="Replacement output appears here..."
          />
          <div className="wb-pane-footer">
            <span>{replacePreview.result.length} characters</span>
            <span className="wb-file-type">Text</span>
          </div>
        </section>
      </div>

      <div className="wb-section-title-row">
        <h2>Matches ({matches.length})</h2>
        <button
          type="button"
          className="wb-button"
          disabled={!matches.length}
          onClick={() => copy(matches.map((m) => m.fullMatch).join('\n'), 'Matches')}
        >
          <IconCopy size={20} aria-hidden="true" />
          Copy matches
        </button>
      </div>
      {matches.length === 0 ? (
        <div className="wb-empty">
          <h2>No matches yet</h2>
          <p>Add a pattern and test text to see matches with capture groups.</p>
        </div>
      ) : (
        matches.slice(0, 200).map((m, i) => (
          <div key={`${m.index}-${i}`} className="wb-list-row">
            <span>
              <strong>{m.fullMatch || '(empty match)'}</strong>
              <small>
                #{i + 1} at index {m.index} · {describeGroups(m)}
              </small>
            </span>
          </div>
        ))
      )}
    </>
  );
}
