import { useEffect, useMemo, useState } from 'react';
import {
  IconArrowBarToLeft,
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export type TextToolMode =
  | 'sort-asc'
  | 'sort-desc'
  | 'sort-numeric'
  | 'dedupe'
  | 'reverse'
  | 'shuffle'
  | 'number'
  | 'trim'
  | 'remove-empty'
  | 'find-replace';

export type NumberFormat = 'dot' | 'pipe' | 'word';

export const TEXT_TOOLS_SAMPLE = `banana
Apple
10 apples

2 pears
100 oranges
Apple
9 plums
  padded line  `;

/**
 * Split into lines with the trailing-newline flag kept aside.
 *
 * Every line operation re-attaches that one newline, so a chain of operations
 * never quietly eats the blank line the user left at the end of their text.
 */
function splitLines(text: string): { lines: string[]; trailing: boolean } {
  const trailing = text.endsWith('\n');
  return { lines: (trailing ? text.slice(0, -1) : text).split('\n'), trailing };
}

function joinLines(lines: string[], trailing: boolean): string {
  return lines.join('\n') + (trailing ? '\n' : '');
}

/** How many lines an operation would see; empty text is zero lines, not one. */
export function lineCount(text: string): number {
  if (!text) return 0;
  return splitLines(text).lines.length;
}

/** The integer a line starts with, or null when it starts with anything else. */
function leadingNumber(line: string): number | null {
  const match = /^\s*(-?\d+)/.exec(line);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Line sort. Numeric mode compares leading integers only, so lines that share
 * a number keep their relative order; anything without a leading number falls
 * back to locale compare. Sorting is stable in both directions because equal
 * lines are ordered by their original index, never by the direction sign.
 */
export function sortLines(text: string, direction: 'asc' | 'desc', numeric: boolean): string {
  const { lines, trailing } = splitLines(text);
  const sorted = lines
    .map((line, index) => ({ line, index }))
    .sort((a, b) => {
      let order: number;
      if (numeric) {
        const left = leadingNumber(a.line);
        const right = leadingNumber(b.line);
        order = left !== null && right !== null ? left - right : a.line.localeCompare(b.line);
      } else {
        order = a.line.localeCompare(b.line);
      }
      if (order === 0) return a.index - b.index;
      return direction === 'asc' ? order : -order;
    })
    .map((entry) => entry.line);
  return joinLines(sorted, trailing);
}

/** Keep the first occurrence of each line; `removed` counts everything dropped. */
export function dedupeLines(
  text: string,
  caseInsensitive: boolean,
): { text: string; removed: number } {
  const { lines, trailing } = splitLines(text);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const line of lines) {
    const key = caseInsensitive ? line.toLowerCase() : line;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(line);
  }
  return { text: joinLines(kept, trailing), removed: lines.length - kept.length };
}

/** Reverses line order; characters inside a line stay where they are. */
export function reverseLines(text: string): string {
  const { lines, trailing } = splitLines(text);
  return joinLines(lines.slice().reverse(), trailing);
}

/**
 * Fisher–Yates over a caller-provided random buffer, so tests can pin an exact
 * permutation and the screen can feed in crypto.getRandomValues output. The
 * buffer is read positionally (wrapping if it is shorter than the line count)
 * and never mutated, which is what makes a fixed seed reproducible.
 */
export function shuffleLines(text: string, seed: Uint32Array): { text: string } {
  const { lines, trailing } = splitLines(text);
  if (seed.length === 0) return { text };
  const shuffled = lines.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = seed[i % seed.length] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { text: joinLines(shuffled, trailing) };
}

/** Rendering of "N. line", "N | line", and "line N" formats, 1-based. */
export function numberLines(text: string, format: NumberFormat): string {
  const { lines, trailing } = splitLines(text);
  const numbered = lines.map((line, index) => {
    const n = index + 1;
    if (format === 'pipe') return `${n} | ${line}`;
    if (format === 'word') return `${line} ${n}`;
    return `${n}. ${line}`;
  });
  return joinLines(numbered, trailing);
}

/**
 * Trims every line, then the text as a whole.
 *
 * The outer trim makes blank edge lines disappear; a trailing newline counts
 * as structure rather than content, so it survives on a non-empty result.
 */
export function trimLines(text: string): string {
  const { lines, trailing } = splitLines(text);
  const trimmed = lines
    .map((line) => line.trim())
    .join('\n')
    .trim();
  if (!trimmed) return '';
  return trailing ? `${trimmed}\n` : trimmed;
}

/** Drops whitespace-only lines too; what looks empty should behave as empty. */
export function removeEmptyLines(text: string): string {
  const { lines, trailing } = splitLines(text);
  const kept = lines.filter((line) => line.trim() !== '');
  if (!kept.length) return '';
  return joinLines(kept, trailing);
}

export type ReplaceOutcome =
  { ok: true; text: string; count: number } | { ok: false; error: string };

/**
 * One replacement engine for both search modes.
 *
 * `count` comes from the same global pattern that performs the replace, so the
 * footer can never disagree with the text. An invalid pattern is an error
 * rather than a silent no-op, and an empty search has nothing to count.
 *
 * The case-sensitive literal path splits on the search text exactly as typed,
 * so the replacement stays verbatim (`$1` is `$1` — there are no groups to
 * refer to). The case-insensitive literal path has to build a pattern, which
 * is also the only way `$&` expands without regex mode.
 */
export function replaceText(
  text: string,
  find: string,
  replacement: string,
  regex: boolean,
  caseSensitive: boolean,
): ReplaceOutcome {
  if (!find) return { ok: false, error: 'Enter something to find.' };
  if (regex) {
    let pattern: RegExp;
    try {
      pattern = new RegExp(find, caseSensitive ? 'g' : 'gi');
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Invalid pattern.' };
    }
    return {
      ok: true,
      text: text.replace(pattern, replacement),
      count: text.match(pattern)?.length ?? 0,
    };
  }
  if (caseSensitive) {
    const parts = text.split(find);
    return { ok: true, text: parts.join(replacement), count: parts.length - 1 };
  }
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped, 'gi');
  return {
    ok: true,
    text: text.replace(pattern, replacement),
    count: text.match(pattern)?.length ?? 0,
  };
}

const MODES: { value: TextToolMode; label: string }[] = [
  { value: 'sort-asc', label: 'Sort A→Z' },
  { value: 'sort-desc', label: 'Sort Z→A' },
  { value: 'sort-numeric', label: 'Sort numerically' },
  { value: 'dedupe', label: 'Deduplicate' },
  { value: 'reverse', label: 'Reverse lines' },
  { value: 'shuffle', label: 'Shuffle' },
  { value: 'number', label: 'Number lines' },
  { value: 'trim', label: 'Trim lines' },
  { value: 'remove-empty', label: 'Remove empty lines' },
  { value: 'find-replace', label: 'Find & replace' },
];

const NUMBER_FORMATS: { value: NumberFormat; label: string }[] = [
  { value: 'dot', label: '1. line' },
  { value: 'pipe', label: '1 | line' },
  { value: 'word', label: 'line 1' },
];

interface TextToolsOutcome {
  text: string;
  error: string;
  /** Deduplicate: how many lines were dropped. */
  removed: number;
  /** Find & replace: how many occurrences were rewritten. */
  replaced: number;
}

const EMPTY_OUTCOME: TextToolsOutcome = { text: '', error: '', removed: 0, replaced: 0 };

export function TextToolsScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [mode, setMode] = useSessionDocumentState<TextToolMode>('mode', 'sort-asc');
  const [caseInsensitive, setCaseInsensitive] = useSessionDocumentState<boolean>(
    'caseInsensitive',
    false,
  );
  const [numberFormat, setNumberFormat] = useSessionDocumentState<NumberFormat>(
    'numberFormat',
    'dot',
  );
  const [find, setFind] = useSessionDocumentState<string>('find', '');
  const [replaceWith, setReplaceWith] = useSessionDocumentState<string>('replaceWith', '');
  const [regex, setRegex] = useSessionDocumentState<boolean>('regex', false);
  const [caseSensitive, setCaseSensitive] = useSessionDocumentState<boolean>('caseSensitive', true);
  const [shuffleRound, setShuffleRound] = useSessionDocumentState<number>('shuffleRound', 0);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo<TextToolsOutcome>(() => {
    if (!input.trim()) return EMPTY_OUTCOME;
    if (mode === 'sort-asc') return { ...EMPTY_OUTCOME, text: sortLines(input, 'asc', false) };
    if (mode === 'sort-desc') return { ...EMPTY_OUTCOME, text: sortLines(input, 'desc', false) };
    if (mode === 'sort-numeric') return { ...EMPTY_OUTCOME, text: sortLines(input, 'asc', true) };
    if (mode === 'dedupe') {
      const deduped = dedupeLines(input, caseInsensitive);
      return { text: deduped.text, error: '', removed: deduped.removed, replaced: 0 };
    }
    if (mode === 'reverse') return { ...EMPTY_OUTCOME, text: reverseLines(input) };
    if (mode === 'shuffle') {
      // The round counter is only a wake-up call: bumping it must recompute
      // this branch with a fresh random buffer, which is what Reshuffle does.
      void shuffleRound;
      const seed = crypto.getRandomValues(new Uint32Array(Math.max(1, lineCount(input))));
      return { ...EMPTY_OUTCOME, text: shuffleLines(input, seed).text };
    }
    if (mode === 'number') return { ...EMPTY_OUTCOME, text: numberLines(input, numberFormat) };
    if (mode === 'trim') return { ...EMPTY_OUTCOME, text: trimLines(input) };
    if (mode === 'remove-empty') return { ...EMPTY_OUTCOME, text: removeEmptyLines(input) };
    // An empty Find field is an idle preview, not an error: the pane mirrors
    // the input until there is something to replace.
    if (!find) return { ...EMPTY_OUTCOME, text: input };
    const replaced = replaceText(input, find, replaceWith, regex, caseSensitive);
    return replaced.ok
      ? { text: replaced.text, error: '', removed: 0, replaced: replaced.count }
      : { ...EMPTY_OUTCOME, error: replaced.error };
  }, [
    input,
    mode,
    caseInsensitive,
    numberFormat,
    find,
    replaceWith,
    regex,
    caseSensitive,
    shuffleRound,
  ]);

  // A failed pattern must keep the previous result on screen; the effect only
  // stores successful outcomes, so the pane never blanks mid-expression.
  const [lastGood, setLastGood] = useState('');
  useEffect(() => {
    if (!outcome.error) setLastGood(outcome.text);
  }, [outcome]);
  const result = outcome.error ? lastGood : outcome.text;

  // The visible result is what "Save Result…" writes; a pattern error withdraws
  // the slot rather than saving a text it is not showing, and an empty input
  // has nothing to save either.
  usePublishedResult(outcome.error ? '' : result, 'Text result', 'txt');

  const loadSample = () => setInput(TEXT_TOOLS_SAMPLE);
  const clear = () => setInput('');
  const useResultAsInput = () => {
    if (!result) return;
    setInput(result);
    notify('Result moved to the input');
  };
  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      notify('Result copied');
    } catch {
      notify('Clipboard unavailable. Select the result and copy it.');
    }
  };
  const applyReplacement = () => {
    if (outcome.error || outcome.replaced === 0) return;
    setInput(outcome.text);
    notify(
      outcome.replaced === 1 ? 'Replaced 1 occurrence' : `Replaced ${outcome.replaced} occurrences`,
    );
  };

  const inputLines = lineCount(input);
  const resultLines = lineCount(result);
  const opStat =
    mode === 'dedupe'
      ? `${outcome.removed} duplicate${outcome.removed === 1 ? '' : 's'} removed`
      : mode === 'number' && resultLines > 0
        ? `numbered 1–${resultLines}`
        : mode === 'find-replace'
          ? `${outcome.replaced} replaced`
          : '';
  const resultFooter = outcome.error
    ? 'Last valid result kept'
    : !inputLines
      ? 'Waiting for input'
      : opStat
        ? `${resultLines} line${resultLines === 1 ? '' : 's'} · ${opStat}`
        : `${resultLines} line${resultLines === 1 ? '' : 's'}`;

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Text Tools</h1>
          <p>Sort, dedupe, number, and clean up lines</p>
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
          className="flex-wrap"
          value={[mode]}
          onValueChange={(v) => setMode((v[0] ?? MODES[0].value) as TextToolMode)}
          variant="outline"
        >
          {MODES.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value}>
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!result}
          onClick={useResultAsInput}
        >
          <IconArrowBarToLeft size={16} stroke={1.7} aria-hidden="true" />
          Use result as input
        </Button>
        {mode === 'shuffle' ? (
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            disabled={!input.trim()}
            onClick={() => setShuffleRound((round) => round + 1)}
          >
            Reshuffle
          </Button>
        ) : null}
        {mode === 'find-replace' ? (
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            disabled={outcome.error !== '' || outcome.replaced === 0}
            onClick={applyReplacement}
          >
            Replace all
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="wb-button" onClick={loadSample}>
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!input}
          onClick={clear}
        >
          <IconEraser size={16} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
      </div>

      {mode === 'dedupe' ? (
        <div className="wb-setting-row">
          <span>
            <strong>Case-insensitive</strong>
            <small>Lines that differ only by letter case count as duplicates.</small>
          </span>
          <Checkbox
            aria-label="Case-insensitive"
            checked={caseInsensitive}
            onCheckedChange={(checked) => setCaseInsensitive(Boolean(checked))}
          />
        </div>
      ) : null}
      {mode === 'number' ? (
        <div className="wb-setting-row">
          <span>
            <strong>Number format</strong>
            <small>How each line is prefixed.</small>
          </span>
          <NativeSelect
            aria-label="Number format"
            value={numberFormat}
            onChange={(e) => setNumberFormat(e.target.value as NumberFormat)}
          >
            {NUMBER_FORMATS.map((f) => (
              <NativeSelectOption key={f.value} value={f.value}>
                {f.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      {mode === 'find-replace' ? (
        <>
          <div className="wb-setting-row">
            <span>
              <strong>Find</strong>
              <small>Literal text, or a regular expression when Regex is on.</small>
            </span>
            <Input
              aria-label="Find"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder="Text to find..."
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Replace with</strong>
              <small>Regex mode expands $1, $&amp; and named groups.</small>
            </span>
            <Input
              aria-label="Replace with"
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
              placeholder="Replacement text..."
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Regex</strong>
              <small>Treat Find as a JavaScript regular expression.</small>
            </span>
            <Checkbox
              aria-label="Regex"
              checked={regex}
              onCheckedChange={(checked) => setRegex(Boolean(checked))}
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Case sensitive</strong>
              <small>Distinguish capital and lower-case letters.</small>
            </span>
            <Checkbox
              aria-label="Case sensitive"
              checked={caseSensitive}
              onCheckedChange={(checked) => setCaseSensitive(Boolean(checked))}
            />
          </div>
        </>
      ) : null}

      {outcome.error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t apply the replacement.</strong>
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
            label="Input text"
            placeholder="Paste your text here..."
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Result panel">
          <div className="wb-pane-header">
            <h2>Result</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!result}
                onClick={() => void copyResult()}
              >
                <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                Copy result
              </Button>
            </div>
          </div>
          <CodeEditor
            value={result}
            readOnly
            wrap={wrap}
            label="Result"
            placeholder="Result will appear here..."
          />
          <div className="wb-pane-footer">
            <span>{resultFooter}</span>
          </div>
        </section>
      </div>
    </>
  );
}
