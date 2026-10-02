import { useSessionDocumentState } from '@/v2/document-state';
import { useDocumentField } from '@/v2/document-state';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { List } from 'react-window';
import type { CSSProperties, ReactElement } from 'react';
import { Download, Columns, AlignJustify, Sparkles } from 'lucide-react';
import { Button, IconButton, Checkbox, Textarea } from '@/ds/components';
import { CopyAction } from '@/v2/EditorPanels';
import { ToolPage, Field, Row, Grid2 } from '@/v2/restyle-kit';
import * as Diff from 'diff';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';
import { useToolPipe } from '@/hooks/use-tool-pipe';
import { useWorkspace } from '@/hooks/use-workspace';

type ViewMode = 'unified' | 'side-by-side';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumOld?: number;
  lineNumNew?: number;
}

function computeDiff(text1: string, text2: string, ignoreWhitespace: boolean): DiffLine[] {
  const changes = Diff.diffLines(
    ignoreWhitespace ? text1.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n') : text1,
    ignoreWhitespace ? text2.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n') : text2,
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

function generatePatch(text1: string, text2: string, ignoreWhitespace: boolean): string {
  const patch = Diff.createTwoFilesPatch(
    'original',
    'modified',
    ignoreWhitespace ? text1.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n') : text1,
    ignoreWhitespace ? text2.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n') : text2,
  );
  return patch;
}

const WORKER_THRESHOLD_BYTES = 50_000;
const WORKER_TIMEOUT_MS = 20_000;

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

const SAMPLE_MODIFIED = `function calculateTotal(items) {
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

/* Diff line washes built from design tokens. */
const ADDED_BG = 'hsl(var(--success) / 0.15)';
const REMOVED_BG = 'hsl(var(--danger) / 0.15)';

const monoText: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
};

const gutterStyle: CSSProperties = {
  width: 40,
  textAlign: 'right',
  padding: '0 8px',
  color: 'hsl(var(--text-faint))',
  fontSize: 'var(--text-xs)',
  lineHeight: '24px',
  userSelect: 'none',
  flexShrink: 0,
  borderRight: '1px solid hsl(var(--border-faint))',
};

function lineToneStyle(type: DiffLine['type']): CSSProperties {
  if (type === 'added') return { background: ADDED_BG };
  if (type === 'removed') return { background: REMOVED_BG };
  return {};
}

function prefixToneColor(type?: DiffLine['type']): string {
  if (type === 'added') return 'hsl(var(--success))';
  if (type === 'removed') return 'hsl(var(--danger))';
  return 'hsl(var(--text-faint))';
}

export default function DiffTool() {
  const [text1, setText1] = useDocumentField<string>('text1', '');
  const [text2, setText2] = useDocumentField<string>('text2', '');
  const [diffLines, setDiffLines] = useSessionDocumentState<DiffLine[]>('diffLines', []);
  const [viewMode, setViewMode] = useSessionDocumentState<ViewMode>('viewMode', 'unified');
  const [ignoreWhitespace, setIgnoreWhitespace] = useSessionDocumentState(
    'ignoreWhitespace',
    false,
  );
  const [hasCompared, setHasCompared] = useSessionDocumentState('hasCompared', false);
  const [isComputing, setIsComputing] = useState(false);
  const diffRef = useRef<HTMLDivElement>(null);
  const shareState = useMemo(
    () => ({ text1, text2, viewMode, ignoreWhitespace }),
    [text1, text2, viewMode, ignoreWhitespace],
  );
  useUrlState(shareState, (state) => {
    setText1(typeof state.text1 === 'string' ? state.text1 : '');
    setText2(typeof state.text2 === 'string' ? state.text2 : '');
    setViewMode(state.viewMode === 'side-by-side' ? 'side-by-side' : 'unified');
    setIgnoreWhitespace(state.ignoreWhitespace === true);
  });
  const { addEntry } = useToolHistory('diff-tool', 'Diff Tool');
  const { consumePipeData } = useToolPipe();
  const consumeWorkspaceState = useWorkspace((state) => state.consumeState);

  useEffect(() => {
    if (text1 || text2) return;
    // Check for smart-paste data from AppHome
    const smartPaste = sessionStorage.getItem('toolbit:smart-paste');
    if (smartPaste) {
      sessionStorage.removeItem('toolbit:smart-paste');
      setText1(smartPaste.trim());
      return;
    }
    const workspaceState = consumeWorkspaceState('diff-tool');
    if (workspaceState) {
      try {
        const parsed = JSON.parse(workspaceState) as { input?: string; output?: string };
        if (parsed.input) {
          const inputData = JSON.parse(parsed.input) as { text1?: string; text2?: string };
          setText1(inputData.text1 || '');
          setText2(inputData.text2 || '');
          return;
        }
      } catch {
        setText1(workspaceState);
      }
      return;
    }
    const payload = consumePipeData();
    if (payload?.data) {
      setText1(payload.data);
    }
  }, [consumePipeData, text1, text2, consumeWorkspaceState, setText1, setText2]);

  const runWorkerDiff = useCallback((inputA: string, inputB: string, whitespace: boolean) => {
    const worker = new Worker(new URL('../../../workers/diff-worker.ts', import.meta.url), {
      type: 'module',
    });
    return new Promise<{ diffLines: DiffLine[]; patch: string }>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timed out'));
      }, WORKER_TIMEOUT_MS);

      worker.onmessage = (
        event: MessageEvent<{
          ok: boolean;
          diffLines?: DiffLine[];
          patch?: string;
          error?: string;
        }>,
      ) => {
        window.clearTimeout(timeout);
        worker.terminate();
        if (event.data?.ok && event.data.diffLines && typeof event.data.patch === 'string') {
          resolve({ diffLines: event.data.diffLines, patch: event.data.patch });
        } else {
          reject(new Error(event.data?.error || 'Worker failed'));
        }
      };

      worker.onerror = (event) => {
        window.clearTimeout(timeout);
        worker.terminate();
        reject(new Error(event.message || 'Worker error'));
      };

      worker.postMessage({ text1: inputA, text2: inputB, ignoreWhitespace: whitespace });
    });
  }, []);

  const compare = useCallback(async () => {
    setIsComputing(true);
    const payloadSize = new Blob([text1, text2]).size;
    try {
      if (payloadSize > WORKER_THRESHOLD_BYTES && 'Worker' in window) {
        const result = await runWorkerDiff(text1, text2, ignoreWhitespace);
        setDiffLines(result.diffLines);
        setHasCompared(true);
        addEntry({
          input: JSON.stringify({ text1, text2 }),
          output: result.patch,
          metadata: { action: 'compare', viewMode, ignoreWhitespace, usedWorker: true },
        });
        setIsComputing(false);
        return;
      }
    } catch (_error) {
      // Worker failed — fall through to the main-thread diff below.
    }

    const lines = computeDiff(text1, text2, ignoreWhitespace);
    setDiffLines(lines);
    setHasCompared(true);
    addEntry({
      input: JSON.stringify({ text1, text2 }),
      output: generatePatch(text1, text2, ignoreWhitespace),
      metadata: { action: 'compare', viewMode, ignoreWhitespace, usedWorker: false },
    });
    setIsComputing(false);
  }, [
    text1,
    text2,
    ignoreWhitespace,
    addEntry,
    viewMode,
    runWorkerDiff,
    setDiffLines,
    setHasCompared,
  ]);

  const loadSample = () => {
    setText1(SAMPLE_ORIGINAL);
    setText2(SAMPLE_MODIFIED);
    setDiffLines([]);
    setHasCompared(false);
  };

  const diffAsText = useMemo(
    () =>
      diffLines
        .map((l) => {
          if (l.type === 'added') return `+ ${l.value}`;
          if (l.type === 'removed') return `- ${l.value}`;
          return `  ${l.value}`;
        })
        .join('\n'),
    [diffLines],
  );

  const exportPatch = () => {
    const patch = generatePatch(text1, text2, ignoreWhitespace);
    const blob = new Blob([patch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'changes.patch';
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    added: diffLines.filter((l) => l.type === 'added').length,
    removed: diffLines.filter((l) => l.type === 'removed').length,
    unchanged: diffLines.filter((l) => l.type === 'unchanged').length,
  };

  return (
    <ToolPage maxWidth={1100}>
      {/* Controls */}
      <Row>
        <Button onClick={compare} disabled={isComputing} data-testid="button-compare">
          Compare
        </Button>
        <Button
          variant="outline"
          iconLeft={<Sparkles size={13} />}
          onClick={loadSample}
          data-testid="button-sample"
        >
          Sample
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Checkbox
            checked={ignoreWhitespace}
            onChange={setIgnoreWhitespace}
            label="Ignore whitespace"
          />
        </div>
      </Row>

      {/* Input areas */}
      <Grid2>
        <Field label="Original">
          <Textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder="Paste original text..."
            style={{ height: 192, resize: 'vertical' }}
            data-testid="input-text1"
          />
        </Field>
        <Field label="Modified">
          <Textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="Paste modified text..."
            style={{ height: 192, resize: 'vertical' }}
            data-testid="input-text2"
          />
        </Field>
      </Grid2>

      {/* Results */}
      {hasCompared && (
        <div style={{ display: 'grid', gap: 10 }}>
          {/* Results toolbar */}
          <Row>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--text-sm)' }}
            >
              <span style={{ color: 'hsl(var(--success))', fontWeight: 500 }}>+{stats.added}</span>
              <span style={{ color: 'hsl(var(--danger))', fontWeight: 500 }}>-{stats.removed}</span>
              <span style={{ color: 'hsl(var(--text-muted))' }}>{stats.unchanged} unchanged</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <IconButton
                variant={viewMode === 'unified' ? 'solid' : 'outline'}
                size="sm"
                title="Unified view"
                onClick={() => setViewMode('unified')}
              >
                <AlignJustify size={14} />
              </IconButton>
              <IconButton
                variant={viewMode === 'side-by-side' ? 'solid' : 'outline'}
                size="sm"
                title="Side-by-side view"
                onClick={() => setViewMode('side-by-side')}
              >
                <Columns size={14} />
              </IconButton>
              <CopyAction text={diffAsText} />
              <Button
                variant="outline"
                size="sm"
                iconLeft={<Download size={13} />}
                onClick={exportPatch}
              >
                .patch
              </Button>
            </div>
          </Row>

          {/* Diff output */}
          <div
            ref={diffRef}
            style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-md)',
              background: 'hsl(var(--surface-0))',
              overflow: 'hidden',
            }}
          >
            {viewMode === 'unified' ? (
              <UnifiedView lines={diffLines} />
            ) : (
              <SideBySideView lines={diffLines} />
            )}
          </div>
        </div>
      )}
    </ToolPage>
  );
}

const ROW_HEIGHT = 24;
const LIST_MAX_HEIGHT = 500;
const VIRTUALIZE_THRESHOLD = 200;

function linePrefix(type: DiffLine['type']): string {
  if (type === 'added') return '+';
  if (type === 'removed') return '-';
  return ' ';
}

interface UnifiedRowProps {
  lines: DiffLine[];
}

function UnifiedLineContent({ line }: { line: DiffLine }) {
  return (
    <>
      <span style={gutterStyle}>{line.lineNumOld ?? ''}</span>
      <span style={gutterStyle}>{line.lineNumNew ?? ''}</span>
      <span
        style={{
          width: 20,
          textAlign: 'center',
          color: prefixToneColor(line.type),
          userSelect: 'none',
          flexShrink: 0,
          lineHeight: '24px',
        }}
      >
        {linePrefix(line.type)}
      </span>
      <span style={{ flex: 1, padding: '0 8px', lineHeight: '24px', whiteSpace: 'pre' }}>
        {line.value}
      </span>
    </>
  );
}

function UnifiedRow({
  index,
  style,
  lines,
}: UnifiedRowProps & {
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' };
  index: number;
  style: CSSProperties;
}): ReactElement {
  const line = lines[index];
  return (
    <div style={{ ...style, display: 'flex', ...lineToneStyle(line.type) }}>
      <UnifiedLineContent line={line} />
    </div>
  );
}

function UnifiedView({ lines }: { lines: DiffLine[] }) {
  const rowProps = useMemo(() => ({ lines }), [lines]);

  // For small diffs, render directly without virtualization overhead
  if (lines.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div style={{ ...monoText, maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', ...lineToneStyle(line.type) }}>
            <UnifiedLineContent line={line} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <List
      rowComponent={UnifiedRow}
      rowCount={lines.length}
      rowHeight={ROW_HEIGHT}
      rowProps={rowProps}
      style={{ ...monoText, maxHeight: LIST_MAX_HEIGHT }}
    />
  );
}

interface SidePair {
  left?: DiffLine;
  right?: DiffLine;
}

interface SideRowProps {
  pairs: SidePair[];
}

const sideGutterStyle: CSSProperties = {
  width: 32,
  textAlign: 'right',
  padding: '0 4px',
  color: 'hsl(var(--text-faint))',
  fontSize: 'var(--text-xs)',
  lineHeight: '24px',
  userSelect: 'none',
  flexShrink: 0,
  borderRight: '1px solid hsl(var(--border-faint))',
};

function cellToneStyle(type?: DiffLine['type']): CSSProperties {
  if (type === 'added') return { background: ADDED_BG };
  if (type === 'removed') return { background: REMOVED_BG };
  return {};
}

function SidePairContent({ pair }: { pair: SidePair }) {
  return (
    <>
      <div
        style={{
          flex: 1,
          display: 'flex',
          minWidth: 0,
          borderRight: '1px solid hsl(var(--border))',
          ...cellToneStyle(pair.left?.type),
        }}
      >
        <span style={sideGutterStyle}>{pair.left?.lineNumOld ?? ''}</span>
        <span
          style={{
            flex: 1,
            padding: '0 8px',
            lineHeight: '24px',
            whiteSpace: 'pre',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pair.left?.value ?? ''}
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', minWidth: 0, ...cellToneStyle(pair.right?.type) }}>
        <span style={sideGutterStyle}>{pair.right?.lineNumNew ?? ''}</span>
        <span
          style={{
            flex: 1,
            padding: '0 8px',
            lineHeight: '24px',
            whiteSpace: 'pre',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pair.right?.value ?? ''}
        </span>
      </div>
    </>
  );
}

function SideBySideRow({
  index,
  style,
  pairs,
}: SideRowProps & {
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' };
  index: number;
  style: CSSProperties;
}): ReactElement {
  const pair = pairs[index];
  return (
    <div style={{ ...style, display: 'flex' }}>
      <SidePairContent pair={pair} />
    </div>
  );
}

function SideBySideView({ lines }: { lines: DiffLine[] }) {
  const pairs = useMemo(() => {
    const result: SidePair[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type === 'unchanged') {
        result.push({ left: line, right: line });
        i++;
      } else if (line.type === 'removed') {
        if (i + 1 < lines.length && lines[i + 1].type === 'added') {
          result.push({ left: line, right: lines[i + 1] });
          i += 2;
        } else {
          result.push({ left: line });
          i++;
        }
      } else {
        result.push({ right: line });
        i++;
      }
    }
    return result;
  }, [lines]);

  const rowProps = useMemo(() => ({ pairs }), [pairs]);

  // For small diffs, render directly
  if (pairs.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div style={{ ...monoText, maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto' }}>
        {pairs.map((pair, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <SidePairContent pair={pair} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <List
      rowComponent={SideBySideRow}
      rowCount={pairs.length}
      rowHeight={ROW_HEIGHT}
      rowProps={rowProps}
      style={{ ...monoText, maxHeight: LIST_MAX_HEIGHT }}
    />
  );
}
