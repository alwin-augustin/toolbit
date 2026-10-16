import { useMemo } from 'react';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconEraser,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';

export type EnvMode = 'to-json' | 'validate' | 'diff';

export type EnvQuote = 'none' | 'single' | 'double';

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
  quoted: EnvQuote;
}

export interface EnvLineError {
  line: number;
  message: string;
  raw: string;
}

export interface EnvDuplicate {
  key: string;
  lines: number[];
}

export interface EnvParseResult {
  entries: EnvEntry[];
  errors: EnvLineError[];
  duplicates: EnvDuplicate[];
}

export interface EnvDiffEntry {
  key: string;
  value: string;
  line: number;
}

export interface EnvDiffChange {
  key: string;
  from: string;
  to: string;
  line: number;
}

export interface EnvDiff {
  added: EnvDiffEntry[];
  removed: EnvDiffEntry[];
  changed: EnvDiffChange[];
  unchanged: number;
}

export const ENV_SAMPLE = `# Toolbit local environment
export APP_ENV=development
PORT=3000
DATABASE_URL="postgres://localhost:5432/toolbit"
API_KEY='replace-me'
LOG_LEVEL=debug
export CACHE_DIR=$HOME/.cache/toolbit
PORT=3000`;

export const ENV_SAMPLE_COMPARE = `# Toolbit local environment
export APP_ENV=staging
PORT=8080
DATABASE_URL="postgres://localhost:5432/toolbit"
API_KEY='replace-me'
export CACHE_DIR=$HOME/.cache/toolbit
FEATURE_FLAGS="checkout,search"`;

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.]*$/;

const DOUBLE_QUOTE_ESCAPES: Record<string, string> = {
  n: '\n',
  t: '\t',
  '"': '"',
  '\\': '\\',
};

/**
 * Split env text into source lines.
 *
 * A single trailing newline terminates the last line rather than adding a
 * blank one, and an empty file has no lines at all — otherwise the validation
 * counts would always claim a blank line.
 */
function envLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Index of the closing quote; `\"` and `\\` inside double quotes are escapes. */
function closingQuoteIndex(value: string, quote: string): number {
  for (let i = 1; i < value.length; i++) {
    if (quote === '"' && value[i] === '\\') {
      i += 1;
      continue;
    }
    if (value[i] === quote) return i;
  }
  return -1;
}

/**
 * Decode the four escapes an env double-quoted value may carry. Anything else
 * keeps its backslash, so `\d` survives a round trip.
 */
function unescapeDoubleQuoted(value: string): string {
  return value.replace(/\\([nt"\\])/g, (match, escape: string) => DOUBLE_QUOTE_ESCAPES[escape]);
}

/** An unquoted value ends at the first ` #` (whitespace then hash). */
function stripTrailingComment(raw: string): string {
  const comment = /[ \t]#/.exec(raw);
  return comment ? raw.slice(0, comment.index) : raw;
}

/**
 * Parse env text line by line.
 *
 * Blank lines and `#` comments are skipped, `export ` is optional sugar in
 * front of the key, and only the first `=` separates key from value. The key
 * must match its pattern exactly — whitespace around the `=` is not part of
 * the grammar — while an unquoted value is trimmed. Malformed lines are
 * reported rather than guessed at, so a caller can refuse to silently drop a
 * variable. Duplicates keep every line number, in first-appearance order.
 */
export function parseEnv(text: string): EnvParseResult {
  const entries: EnvEntry[] = [];
  const errors: EnvLineError[] = [];
  const keyLines = new Map<string, number[]>();

  envLines(text).forEach((rawLine, index) => {
    const line = index + 1;
    const content = rawLine.trimStart();
    if (content === '' || content.startsWith('#')) return;
    const raw = rawLine.trim();
    const assignment = content.replace(/^export[ \t]+/, '');
    const equals = assignment.indexOf('=');
    if (equals === -1) {
      errors.push({ line, message: 'Missing "="', raw });
      return;
    }
    const key = assignment.slice(0, equals);
    if (key === '') {
      errors.push({ line, message: 'Missing key before "="', raw });
      return;
    }
    if (!ENV_KEY_PATTERN.test(key)) {
      errors.push({ line, message: `Invalid key "${key}"`, raw });
      return;
    }
    const rawValue = assignment.slice(equals + 1);
    // Whitespace right after the `=` never belongs to the value, so a quoted
    // value may be indented without the quotes turning into literal text.
    const valueStart = rawValue.replace(/^[ \t]+/, '');
    let value: string;
    let quoted: EnvQuote = 'none';
    if (valueStart.startsWith('"') || valueStart.startsWith("'")) {
      const quote = valueStart[0];
      const close = closingQuoteIndex(valueStart, quote);
      if (close === -1) {
        errors.push({
          line,
          message: `Unterminated ${quote === '"' ? 'double' : 'single'}-quoted value`,
          raw,
        });
        return;
      }
      // The closing quote ends the value; only whitespace or a comment may
      // follow it.
      if (!/^\s*(#.*)?$/.test(valueStart.slice(close + 1))) {
        errors.push({ line, message: 'Unexpected text after the closing quote', raw });
        return;
      }
      quoted = quote === '"' ? 'double' : 'single';
      const inner = valueStart.slice(1, close);
      value = quote === '"' ? unescapeDoubleQuoted(inner) : inner;
    } else {
      value = stripTrailingComment(rawValue).trim();
    }
    entries.push({ key, value, line, quoted });
    const priorLines = keyLines.get(key);
    if (priorLines) priorLines.push(line);
    else keyLines.set(key, [line]);
  });

  const duplicates: EnvDuplicate[] = [];
  for (const [key, lines] of keyLines) {
    if (lines.length > 1) duplicates.push({ key, lines });
  }

  return { entries, errors, duplicates };
}

/**
 * Convert to a JSON object, 2-space indented.
 *
 * A repeated key keeps its last value, matching how dotenv-style loaders
 * resolve duplicates; its position follows the first occurrence, because
 * assigning to an existing object key preserves insertion order. Conversion
 * refuses to run while malformed lines remain.
 */
export function envToJson(text: string): { ok: true; json: string } | { ok: false; error: string } {
  const parsed = parseEnv(text);
  if (parsed.errors.length > 0) {
    const lineNumbers = parsed.errors.map((error) => error.line).join(', ');
    return {
      ok: false,
      error:
        parsed.errors.length === 1
          ? `Malformed line ${lineNumbers}. Fix it before converting to JSON.`
          : `Malformed lines ${lineNumbers}. Fix them before converting to JSON.`,
    };
  }
  const object: Record<string, string> = {};
  for (const entry of parsed.entries) object[entry.key] = entry.value;
  return { ok: true, json: JSON.stringify(object, null, 2) };
}

/**
 * Validate env text and describe it in a human-readable report.
 *
 * `ok` covers the hard problems only — malformed lines and duplicate keys.
 * Warnings (unquoted values a CLI could mangle, empty values, keys that
 * differ only by case) are advisory and leave `ok` true.
 */
export function validateEnv(text: string): { ok: boolean; report: string } {
  const parsed = parseEnv(text);
  const lines = envLines(text);
  const blankLines = lines.filter((line) => line.trim() === '').length;
  const commentLines = lines.filter((line) => line.trimStart().startsWith('#')).length;

  const warnings: string[] = [];
  for (const entry of parsed.entries) {
    if (entry.quoted === 'none' && (/\s/.test(entry.value) || entry.value.includes('$'))) {
      warnings.push(
        `Line ${entry.line}: ${entry.key} is unquoted and contains spaces or $; quote it if a CLI might mangle it.`,
      );
    }
    if (entry.value === '') {
      warnings.push(`Line ${entry.line}: ${entry.key} has an empty value.`);
    }
  }

  // Same name in a different case reads as the same variable to some tools.
  const caseGroups = new Map<string, Map<string, number>>();
  for (const entry of parsed.entries) {
    const group = caseGroups.get(entry.key.toLowerCase()) ?? new Map<string, number>();
    if (!group.has(entry.key)) group.set(entry.key, entry.line);
    caseGroups.set(entry.key.toLowerCase(), group);
  }
  for (const group of caseGroups.values()) {
    if (group.size > 1) {
      const keys = [...group.entries()].map(([key, line]) => `${key} (line ${line})`).join(', ');
      warnings.push(`Keys differ only by case: ${keys}.`);
    }
  }

  const report: string[] = [
    'Env file report',
    `Variables: ${parsed.entries.length}`,
    `Comments skipped: ${commentLines}`,
    `Blank lines: ${blankLines}`,
  ];
  if (parsed.duplicates.length > 0) {
    report.push('', 'Duplicate keys:');
    for (const duplicate of parsed.duplicates) {
      report.push(`  ${duplicate.key} (lines ${duplicate.lines.join(', ')})`);
    }
  }
  if (parsed.errors.length > 0) {
    report.push('', 'Malformed lines:');
    for (const error of parsed.errors) {
      report.push(`  Line ${error.line}: ${error.message} — ${error.raw}`);
    }
  }
  if (warnings.length > 0) {
    report.push('', 'Warnings:');
    for (const warning of warnings) report.push(`  ${warning}`);
  }
  const issues = parsed.errors.length + parsed.duplicates.length;
  report.push(
    '',
    issues === 0 ? 'No issues found.' : `Not valid: ${issues} issue${issues === 1 ? '' : 's'} found.`,
  );
  return { ok: issues === 0, report: report.join('\n') };
}

/** Last occurrence of a key wins, the same rule `envToJson` uses. */
function lastValues(entries: EnvEntry[]): Map<string, EnvEntry> {
  const map = new Map<string, EnvEntry>();
  for (const entry of entries) map.set(entry.key, entry);
  return map;
}

/** Code-point order keeps the result stable regardless of locale. */
function sortByKey<T extends { key: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * Compare two env files by key, ignoring file order.
 *
 * Values are compared verbatim after parsing. Changed entries carry the line
 * from `b`, where the new value lives.
 */
export function diffEnv(a: string, b: string): EnvDiff {
  const left = lastValues(parseEnv(a).entries);
  const right = lastValues(parseEnv(b).entries);
  const added: EnvDiffEntry[] = [];
  const removed: EnvDiffEntry[] = [];
  const changed: EnvDiffChange[] = [];
  let unchanged = 0;
  for (const [key, entry] of right) {
    const prior = left.get(key);
    if (!prior) added.push({ key, value: entry.value, line: entry.line });
    else if (prior.value !== entry.value) {
      changed.push({ key, from: prior.value, to: entry.value, line: entry.line });
    } else unchanged += 1;
  }
  for (const [key, entry] of left) {
    if (!right.has(key)) removed.push({ key, value: entry.value, line: entry.line });
  }
  return {
    added: sortByKey(added),
    removed: sortByKey(removed),
    changed: sortByKey(changed),
    unchanged,
  };
}

/** Keep a multi-line parsed value on one line in the summary text. */
function displayValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

/** One line per finding with a +/- marker, then the unchanged count. */
export function formatEnvDiff(diff: EnvDiff): string {
  const lines: string[] = [];
  for (const entry of diff.added) {
    lines.push(`+ ${entry.key}=${displayValue(entry.value)} (line ${entry.line})`);
  }
  for (const entry of diff.removed) {
    lines.push(`- ${entry.key}=${displayValue(entry.value)} (line ${entry.line})`);
  }
  for (const change of diff.changed) {
    lines.push(
      `~ ${change.key}: ${displayValue(change.from)} -> ${displayValue(change.to)} (line ${change.line})`,
    );
  }
  if (lines.length === 0) lines.push('No differences found.');
  lines.push(`Unchanged: ${diff.unchanged}`);
  return lines.join('\n');
}

const MODES: { value: EnvMode; label: string }[] = [
  { value: 'to-json', label: 'To JSON' },
  { value: 'validate', label: 'Validate' },
  { value: 'diff', label: 'Diff' },
];

const EMPTY_DIFF: EnvDiff = { added: [], removed: [], changed: [], unchanged: 0 };

/** Everything the screen derives from the active mode and its editors. */
interface EnvOutcome {
  /** Text the result pane shows and the screen would save. */
  output: string;
  /** Banner text; only the JSON conversion refuses to run. */
  error: string;
  /** Validate mode: null until there is input to judge. */
  valid: boolean | null;
  /** Validate mode: malformed lines plus duplicate keys, warnings excluded. */
  issues: number;
  diff: EnvDiff;
}

/** Keep empty values visible in row text instead of leaving a gap. */
function valueLabel(value: string): string {
  return value === '' ? '(empty)' : value;
}

export function EnvScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [current, setCurrent] = useDocumentField<string>('current', '');
  const [compare, setCompare] = useDocumentField<string>('compare', '');
  const [mode, setMode] = useSessionDocumentState<EnvMode>('mode', 'to-json');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo<EnvOutcome>(() => {
    const empty: EnvOutcome = { output: '', error: '', valid: null, issues: 0, diff: EMPTY_DIFF };
    if (mode === 'to-json') {
      if (!input.trim()) return empty;
      const converted = envToJson(input);
      if (!converted.ok) return { ...empty, error: converted.error, valid: false };
      return { ...empty, output: converted.json, valid: true };
    }
    if (mode === 'validate') {
      if (!input.trim()) return empty;
      const parsed = parseEnv(input);
      const validation = validateEnv(input);
      return {
        ...empty,
        output: validation.report,
        valid: validation.ok,
        issues: parsed.errors.length + parsed.duplicates.length,
      };
    }
    if (!current.trim() && !compare.trim()) return empty;
    const diff = diffEnv(current, compare);
    return { ...empty, output: formatEnvDiff(diff), diff };
  }, [mode, input, current, compare]);

  const hasInput =
    mode === 'diff' ? Boolean(current.trim() || compare.trim()) : Boolean(input.trim());
  const counts = outcome.diff;

  // The pane's own output is what a save would write, named after the mode that
  // produced it. An error withdraws the slot rather than saving a message.
  usePublishedResult(
    outcome.error ? '' : outcome.output,
    mode === 'to-json' ? 'Env JSON' : mode === 'validate' ? 'Validation report' : 'Env diff',
    mode === 'to-json' ? 'json' : 'txt',
  );

  const loadSample = () => {
    if (mode === 'diff') {
      setCurrent(ENV_SAMPLE);
      setCompare(ENV_SAMPLE_COMPARE);
    } else {
      setInput(ENV_SAMPLE);
    }
  };

  const clearInput = () => {
    if (mode === 'diff') {
      setCurrent('');
      setCompare('');
    } else {
      setInput('');
    }
  };

  const copyOutput = async () => {
    if (!outcome.output) return;
    try {
      await navigator.clipboard.writeText(outcome.output);
      notify(mode === 'diff' ? 'Diff copied' : 'Output copied');
    } catch {
      notify('Clipboard unavailable. Select the output and copy it.');
    }
  };

  const reportTitle = mode === 'to-json' ? 'JSON' : 'Validation report';
  const issuesLabel = `${outcome.issues} issue${outcome.issues === 1 ? '' : 's'}`;

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Env File Tools</h1>
          <p>Convert, validate, and diff .env files</p>
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
          onValueChange={(v) => setMode((v[0] ?? MODES[0].value) as EnvMode)}
          variant="outline"
        >
          {MODES.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value}>
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button type="button" variant="outline" className="wb-button" onClick={loadSample}>
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={clearInput}
          disabled={!hasInput}
        >
          <IconEraser size={16} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
      </div>
      {outcome.error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t convert this env file.</strong>
          <span>{outcome.error}</span>
        </div>
      ) : null}
      {mode === 'diff' ? (
        <div className="wb-editors">
          <section className="wb-editor-pane" aria-label="Current env panel">
            <div className="wb-pane-header">
              <h2>Current</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="wb-button quiet wb-clear"
                onClick={() => setCurrent('')}
              >
                Clear
              </Button>
            </div>
            <CodeEditor
              value={current}
              onChange={setCurrent}
              language="shell"
              wrap={wrap}
              label="Current env file"
              placeholder="Paste the current .env file..."
            />
            <div className="wb-pane-footer">
              <span>{current.length} characters</span>
              <span className="wb-file-type">Env</span>
            </div>
          </section>
          <section className="wb-editor-pane" aria-label="Compare env panel">
            <div className="wb-pane-header">
              <h2>Compare</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="wb-button quiet wb-clear"
                onClick={() => setCompare('')}
              >
                Clear
              </Button>
            </div>
            <CodeEditor
              value={compare}
              onChange={setCompare}
              language="shell"
              wrap={wrap}
              label="Compare env file"
              placeholder="Paste the .env file to compare against..."
            />
            <div className="wb-pane-footer">
              <span>{compare.length} characters</span>
              <span className="wb-file-type">Env</span>
            </div>
          </section>
        </div>
      ) : (
        <div className="wb-editors">
          <section className="wb-editor-pane" aria-label="Input panel">
            <div className="wb-pane-header">
              <h2>Input</h2>
            </div>
            <CodeEditor
              value={input}
              onChange={setInput}
              language="shell"
              wrap={wrap}
              label="Env file input"
              placeholder="Paste your .env file here..."
            />
            <div className="wb-pane-footer">
              <span>{input.length} characters</span>
              <span className="wb-file-type">Env</span>
            </div>
          </section>
          <section className="wb-editor-pane" aria-label="Result panel">
            <div className="wb-pane-header">
              <h2>{reportTitle}</h2>
              {mode === 'validate' ? (
                <span className="wb-result-state inline-flex items-center gap-1" role="status">
                  {!input.trim() ? (
                    'Waiting for input'
                  ) : outcome.valid ? (
                    <>
                      <IconCircleCheck
                        size={16}
                        stroke={1.7}
                        className="wb-green"
                        aria-hidden="true"
                      />
                      Valid
                    </>
                  ) : (
                    <>
                      <IconAlertTriangle size={16} stroke={1.7} aria-hidden="true" />
                      {issuesLabel}
                    </>
                  )}
                </span>
              ) : null}
              <div className="wb-copy-actions">
                <Button
                  type="button"
                  className="wb-button primary"
                  disabled={!outcome.output}
                  onClick={() => void copyOutput()}
                >
                  <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                  Copy
                </Button>
              </div>
            </div>
            <CodeEditor
              value={outcome.error ? '' : outcome.output}
              readOnly
              wrap={wrap}
              language={mode === 'to-json' ? 'json' : 'text'}
              label={mode === 'to-json' ? 'Env JSON result' : 'Env validation report'}
              placeholder={
                mode === 'to-json'
                  ? 'JSON will appear here...'
                  : 'Validation report will appear here...'
              }
            />
            <div className="wb-pane-footer">
              <span>{outcome.output ? `${outcome.output.length} characters` : 'Waiting for input'}</span>
              <span className="wb-file-type">{mode === 'to-json' ? 'JSON' : 'Text'}</span>
            </div>
          </section>
        </div>
      )}
      {mode === 'diff' ? (
        <>
          <div className="wb-section-title-row">
            <h2>Result</h2>
          </div>
          <section className="wb-editor-pane" aria-label="Diff result panel">
            <div className="wb-pane-header">
              <h2>Diff result</h2>
              <div className="wb-copy-actions">
                <Button
                  type="button"
                  className="wb-button primary"
                  disabled={!outcome.output}
                  onClick={() => void copyOutput()}
                >
                  <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                  Copy
                </Button>
              </div>
            </div>
            {hasInput ? (
              <div className="wb-pane-body">
                {counts.added.length === 0 &&
                counts.removed.length === 0 &&
                counts.changed.length === 0 ? (
                  <div className="wb-setting-row">
                    <span>
                      <strong>No differences</strong>
                      <small>
                        {counts.unchanged} key{counts.unchanged === 1 ? '' : 's'} unchanged. Values
                        compare verbatim.
                      </small>
                    </span>
                    <IconCircleCheck size={20} className="wb-green" aria-hidden="true" />
                  </div>
                ) : null}
                {counts.added.map((entry) => (
                  <div className="wb-list-row" key={`added-${entry.key}`}>
                    <span
                      className="font-mono"
                      style={{ color: 'var(--code-added)' }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                    <span>
                      <strong className="font-mono">{entry.key}</strong>
                      <small>
                        Added · {valueLabel(entry.value)} · line {entry.line}
                      </small>
                    </span>
                  </div>
                ))}
                {counts.removed.map((entry) => (
                  <div className="wb-list-row" key={`removed-${entry.key}`}>
                    <span
                      className="font-mono"
                      style={{ color: 'var(--code-removed)' }}
                      aria-hidden="true"
                    >
                      -
                    </span>
                    <span>
                      <strong className="font-mono">{entry.key}</strong>
                      <small>
                        Removed · {valueLabel(entry.value)} · line {entry.line}
                      </small>
                    </span>
                  </div>
                ))}
                {counts.changed.map((change) => (
                  <div className="wb-list-row" key={`changed-${change.key}`}>
                    <span className="font-mono" aria-hidden="true">
                      ~
                    </span>
                    <span>
                      <strong className="font-mono">{change.key}</strong>
                      <small>
                        Changed · {valueLabel(change.from)} → {valueLabel(change.to)} · line{' '}
                        {change.line}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="wb-empty">
                <h2>Nothing to compare yet</h2>
                <p>Paste a .env file on each side to compare keys and values.</p>
              </div>
            )}
            <div className="wb-pane-footer">
              <span>
                {hasInput
                  ? `${counts.added.length} added · ${counts.removed.length} removed · ${counts.changed.length} changed · ${counts.unchanged} unchanged`
                  : 'Waiting for input'}
              </span>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
