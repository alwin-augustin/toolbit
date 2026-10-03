import { useMemo } from 'react';
import { IconCopy, IconEraser, IconGitCompare, IconSparkles } from '@tabler/icons-react';
import * as Diff from 'diff';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export type DiffLineType = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
  type: DiffLineType;
  value: string;
  lineNumOld?: number;
  lineNumNew?: number;
}

export interface DiffPair {
  left?: DiffLine;
  right?: DiffLine;
}

export type DiffViewMode = 'unified' | 'side-by-side';

export interface DiffCounts {
  added: number;
  removed: number;
  unchanged: number;
}

export function normalizeForDiff(text: string, ignoreWhitespace: boolean): string {
  if (!ignoreWhitespace) return text;
  return text.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n');
}

/** Line diff ported from the legacy DiffTool (diff package, same numbering). */
export function computeDiffLines(
  original: string,
  changed: string,
  ignoreWhitespace = false,
): DiffLine[] {
  if (original.length + changed.length > 1_000_000) return [];
  const changes = Diff.diffLines(
    normalizeForDiff(original, ignoreWhitespace),
    normalizeForDiff(changed, ignoreWhitespace),
  );
  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  for (const change of changes) {
    const changeLines = change.value.replace(/\n$/, '').split('\n');
    for (const line of changeLines) {
      if (change.added) {
        lines.push({ type: 'added', value: line, lineNumNew: newLine++ });
      } else if (change.removed) {
        lines.push({ type: 'removed', value: line, lineNumOld: oldLine++ });
      } else {
        lines.push({
          type: 'unchanged',
          value: line,
          lineNumOld: oldLine++,
          lineNumNew: newLine++,
        });
      }
    }
  }
  return lines;
}

export function diffStats(lines: DiffLine[]): DiffCounts {
  return {
    added: lines.filter((l) => l.type === 'added').length,
    removed: lines.filter((l) => l.type === 'removed').length,
    unchanged: lines.filter((l) => l.type === 'unchanged').length,
  };
}

export function formatUnifiedText(lines: DiffLine[]): string {
  return lines
    .map((l) => {
      if (l.type === 'added') return `+ ${l.value}`;
      if (l.type === 'removed') return `- ${l.value}`;
      return `  ${l.value}`;
    })
    .join('\n');
}

/** Pair removed/added lines for the side-by-side view (legacy pairing logic). */
export function pairDiffLines(lines: DiffLine[]): DiffPair[] {
  const pairs: DiffPair[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.type === 'unchanged') {
      pairs.push({ left: line, right: line });
      i += 1;
    } else if (line.type === 'removed') {
      if (i + 1 < lines.length && lines[i + 1].type === 'added') {
        pairs.push({ left: line, right: lines[i + 1] });
        i += 2;
      } else {
        pairs.push({ left: line });
        i += 1;
      }
    } else {
      pairs.push({ right: line });
      i += 1;
    }
  }
  return pairs;
}

function pairMarker(line: DiffLine | undefined): string {
  if (line?.type === 'added') return '+';
  if (line?.type === 'removed') return '-';
  return ' ';
}

export function formatSideBySideText(pairs: DiffPair[]): string {
  const leftWidth = Math.min(
    500,
    pairs.reduce((max, p) => Math.max(max, (p.left?.value ?? '').length), 0),
  );
  return pairs
    .map(
      ({ left, right }) =>
        `${pairMarker(left)} ${(left?.value ?? '').padEnd(leftWidth)} | ${pairMarker(right)} ${right?.value ?? ''}`,
    )
    .join('\n');
}

const SAMPLE_ORIGINAL = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function formatCurrency(amount) {
  return "$" + amount.toFixed(2);
}`;

const SAMPLE_CHANGED = `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return Math.round(total * 100) / 100;
}

function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}`;

export function DiffScreen() {
  const [original, setOriginal] = useDocumentField<string>('original', '');
  const [changed, setChanged] = useDocumentField<string>('changed', '');
  const [viewMode, setViewMode] = useSessionDocumentState<DiffViewMode>('viewMode', 'unified');
  const [ignoreWhitespace, setIgnoreWhitespace] = useSessionDocumentState(
    'ignoreWhitespace',
    false,
  );
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);
  const oversized = original.length + changed.length > 1_000_000;

  const lines = useMemo(
    () => (oversized ? [] : computeDiffLines(original, changed, ignoreWhitespace)),
    [original, changed, ignoreWhitespace, oversized],
  );
  const stats = useMemo(() => diffStats(lines), [lines]);
  const output = useMemo(() => {
    if (viewMode === 'side-by-side') return formatSideBySideText(pairDiffLines(lines));
    return formatUnifiedText(lines);
  }, [lines, viewMode]);

  const loadSample = () => {
    setOriginal(SAMPLE_ORIGINAL);
    setChanged(SAMPLE_CHANGED);
  };
  const clear = () => {
    setOriginal('');
    setChanged('');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      notify('Diff copied');
    } catch {
      notify('Clipboard unavailable. Select the result and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Diff</h1>
          <p>Compare two texts</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconGitCompare size={18} />
            {stats.added} added · {stats.removed} removed
          </span>
          <span>{stats.unchanged} unchanged</span>
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
        <button type="button" className="wb-button" onClick={copy} disabled={!output}>
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy diff
        </button>
        <label className="wb-indent-label">
          Mode:
          <select
            aria-label="Diff mode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as DiffViewMode)}
          >
            <option value="unified">Unified</option>
            <option value="side-by-side">Side-by-side</option>
          </select>
        </label>
      </div>

      <div className="wb-setting-row">
        <span>
          <strong>Ignore whitespace</strong>
          <small>Collapse runs of spaces and tabs before comparing.</small>
        </span>
        <input
          type="checkbox"
          aria-label="Ignore whitespace"
          checked={ignoreWhitespace}
          onChange={(e) => setIgnoreWhitespace(e.target.checked)}
        />
      </div>
      {oversized ? (
        <div className="wb-error-banner" role="alert">
          <strong>Inputs too large to diff.</strong>
          <span>Combined inputs exceed 1 MB. Trim the texts to compare.</span>
        </div>
      ) : null}

      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Original text panel">
          <div className="wb-pane-header">
            <h2>Original</h2>
            <button
              type="button"
              className="wb-button quiet wb-clear"
              onClick={() => setOriginal('')}
            >
              Clear
            </button>
          </div>
          <CodeEditor
            value={original}
            onChange={setOriginal}
            wrap={wrap}
            label="Original text"
            placeholder="Paste original text..."
          />
          <div className="wb-pane-footer">
            <span>{original.length} characters</span>
            <span className="wb-file-type">Text</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Changed text panel">
          <div className="wb-pane-header">
            <h2>Changed</h2>
            <button
              type="button"
              className="wb-button quiet wb-clear"
              onClick={() => setChanged('')}
            >
              Clear
            </button>
          </div>
          <CodeEditor
            value={changed}
            onChange={setChanged}
            wrap={wrap}
            label="Changed text"
            placeholder="Paste modified text..."
          />
          <div className="wb-pane-footer">
            <span>{changed.length} characters</span>
            <span className="wb-file-type">Text</span>
          </div>
        </section>
      </div>

      <div className="wb-section-title-row">
        <h2>Result</h2>
      </div>
      <section className="wb-editor-pane" aria-label="Diff result panel">
        <div className="wb-pane-header">
          <h2>{viewMode === 'side-by-side' ? 'Side-by-side' : 'Unified'} diff</h2>
        </div>
        <CodeEditor value={output} readOnly wrap={wrap} label="Diff result" />
        <div className="wb-pane-footer">
          <span>
            {stats.added} added · {stats.removed} removed · {stats.unchanged} unchanged
          </span>
        </div>
      </section>
    </>
  );
}
