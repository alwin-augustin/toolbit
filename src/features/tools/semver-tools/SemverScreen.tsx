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
import { usePublishedResult } from '@/shared/result-store';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type SemverMode = 'compare' | 'sort';

export interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
  raw: string;
  normalized: string;
}

/**
 * A demo list for both modes: stable and prerelease entries, build metadata,
 * a leading v, and a two-part version, deliberately not in order.
 */
export const SEMVER_SAMPLE = [
  '1.0.0-alpha',
  '1.0.0-alpha.1',
  '1.0.0-beta.2',
  '1.0.0-rc.1',
  '1.0.0',
  '1.2',
  '1.2.3+build.5',
  '1.10.0',
  'v2.0.0',
  '0.9.5',
].join('\n');

/** One core number, captured by the pattern below; leading zeros are not it. */
const CORE = '(?:0|[1-9]\\d*)';

/**
 * Lenient in the ways package managers are: an optional leading v, and 1- or
 * 2-part versions (1.2 reads as 1.2.0). Strict about the rest, including the
 * no-leading-zeros rule for numeric identifiers.
 */
const SEMVER_PATTERN = new RegExp(
  `^(${CORE})(?:\\.(${CORE}))?(?:\\.(${CORE}))?(?:-([0-9A-Za-z.-]+))?(?:\\+([0-9A-Za-z.-]+))?$`,
);

function splitIdentifiers(text: string, allowLeadingZeros: boolean): string[] | null {
  const identifiers = text.split('.');
  for (const identifier of identifiers) {
    if (!identifier) return null;
    if (!/^[0-9A-Za-z-]+$/.test(identifier)) return null;
    if (!allowLeadingZeros && /^\d+$/.test(identifier) && !/^(0|[1-9]\d*)$/.test(identifier)) {
      return null;
    }
  }
  return identifiers;
}

export function parseSemver(input: string): { ok: true; v: Semver } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a version like 1.2.3.' };
  // Package managers accept a leading v; semver.org itself does not use one.
  const text = /^[vV]/.test(raw) ? raw.slice(1) : raw;
  const match = SEMVER_PATTERN.exec(text);
  if (!match) {
    return {
      ok: false,
      error: 'Expected digits joined by dots, e.g. 1.2.3, with no leading zeros.',
    };
  }
  const major = match[1] ?? '0';
  const minor = match[2] ?? '0';
  const patch = match[3] ?? '0';
  const prerelease = match[4] ? splitIdentifiers(match[4], false) : [];
  const build = match[5] ? splitIdentifiers(match[5], true) : [];
  if (prerelease === null || build === null) {
    return {
      ok: false,
      error:
        prerelease === null
          ? 'Prerelease identifiers cannot be empty or carry leading zeros.'
          : 'Build identifiers cannot be empty.',
    };
  }
  const core = `${Number(major)}.${Number(minor)}.${Number(patch)}`;
  return {
    ok: true,
    v: {
      major: Number(major),
      minor: Number(minor),
      patch: Number(patch),
      prerelease,
      build,
      raw,
      normalized:
        core +
        (prerelease.length ? `-${prerelease.join('.')}` : '') +
        (build.length ? `+${build.join('.')}` : ''),
    },
  };
}

const isNumeric = (identifier: string): boolean => /^\d+$/.test(identifier);

/** semver.org §11, with build metadata ignored. */
export function compareSemver(a: Semver, b: Semver): -1 | 0 | 1 {
  for (const [left, right] of [
    [a.major, b.major],
    [a.minor, b.minor],
    [a.patch, b.patch],
  ] as const) {
    if (left !== right) return left < right ? -1 : 1;
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  // A prerelease sorts before the release it belongs to.
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
    const left = a.prerelease[i];
    const right = b.prerelease[i];
    // Everything before this identifier is equal, so the larger set wins.
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (left === right) continue;
    const leftNumeric = isNumeric(left);
    const rightNumeric = isNumeric(right);
    if (leftNumeric && rightNumeric) {
      // Numeric identifiers carry no leading zeros, so length orders them.
      if (left.length !== right.length) return left.length < right.length ? -1 : 1;
      return left < right ? -1 : 1;
    }
    if (leftNumeric) return -1;
    if (rightNumeric) return 1;
    return left < right ? -1 : 1;
  }
  return 0;
}

export interface InvalidVersion {
  /** 1-based position in the list as it was passed in. */
  line: number;
  raw: string;
  error: string;
}

export function sortVersions(
  list: string[],
  direction: 'asc' | 'desc',
): { ok: true; sorted: string[]; invalid: InvalidVersion[] } {
  const valid: { raw: string; v: Semver }[] = [];
  const invalid: InvalidVersion[] = [];
  list.forEach((raw, index) => {
    const parsed = parseSemver(raw);
    if (parsed.ok) valid.push({ raw, v: parsed.v });
    else invalid.push({ line: index + 1, raw, error: parsed.error });
  });
  valid.sort((left, right) => {
    const order = compareSemver(left.v, right.v);
    return direction === 'desc' ? -order : order;
  });
  return { ok: true, sorted: valid.map((entry) => entry.raw), invalid };
}

/** Split one version per line, also accepting spaces and commas as separators. */
export function splitEntries(input: string): Array<{ raw: string; line: number }> {
  const entries: Array<{ raw: string; line: number }> = [];
  input.split('\n').forEach((text, index) => {
    for (const raw of text.split(/[\s,]+/)) {
      if (raw) entries.push({ raw, line: index + 1 });
    }
  });
  return entries;
}

function comparisonReason(lower: Semver, higher: Semver): string {
  if (lower.major !== higher.major) {
    return `its major number is lower (${lower.major} < ${higher.major})`;
  }
  if (lower.minor !== higher.minor) {
    return `its minor number is lower (${lower.minor} < ${higher.minor})`;
  }
  if (lower.patch !== higher.patch) {
    return `its patch number is lower (${lower.patch} < ${higher.patch})`;
  }
  // The core numbers match, so the difference is in the prerelease.
  if (higher.prerelease.length === 0) return 'a prerelease sorts before the release';
  for (let i = 0; i < lower.prerelease.length; i++) {
    const left = lower.prerelease[i];
    const right = higher.prerelease[i];
    if (right === undefined)
      return 'its prerelease set is shorter and all earlier identifiers match';
    if (left === right) continue;
    const leftNumeric = isNumeric(left);
    const rightNumeric = isNumeric(right);
    if (leftNumeric && rightNumeric) return `prerelease ${left} sorts before ${right} numerically`;
    if (leftNumeric) return 'a numeric prerelease identifier sorts before an alphanumeric one';
    if (rightNumeric) return 'an alphanumeric prerelease identifier sorts after a numeric one';
    return `prerelease ${left} sorts before ${right} alphabetically`;
  }
  return 'its prerelease set is shorter and all earlier identifiers match';
}

/** One plain-words sentence about how the two versions rank. */
export function explainComparison(a: Semver, b: Semver): string {
  const order = compareSemver(a, b);
  if (order === 0) {
    if (a.build.join('.') !== b.build.join('.')) {
      return `${a.normalized} and ${b.normalized} rank the same because build metadata is ignored.`;
    }
    return `${a.normalized} and ${b.normalized} are the same version.`;
  }
  const lower = order < 0 ? a : b;
  const higher = order < 0 ? b : a;
  return `${lower.normalized} is lower than ${higher.normalized} because ${comparisonReason(lower, higher)}.`;
}

const MODES: { value: SemverMode; label: string }[] = [
  { value: 'compare', label: 'Compare' },
  { value: 'sort', label: 'Sort' },
];

export function SemverScreen() {
  const [mode, setMode] = useSessionDocumentState<SemverMode>('mode', 'compare');
  const [versionA, setVersionA] = useSessionDocumentState<string>('versionA', '1.2.0-rc.1');
  const [versionB, setVersionB] = useSessionDocumentState<string>('versionB', '1.2.0');
  const [listInput, setListInput] = useDocumentField<string>('versions', SEMVER_SAMPLE);
  const [descending, setDescending] = useSessionDocumentState<boolean>('descending', false);
  const notify = useWorkbenchMemory((s) => s.notify);

  const parsedA = useMemo(() => parseSemver(versionA), [versionA]);
  const parsedB = useMemo(() => parseSemver(versionB), [versionB]);

  const compareError = useMemo(() => {
    const problems: string[] = [];
    if (!parsedA.ok) problems.push(`Version A: ${parsedA.error}`);
    if (!parsedB.ok) problems.push(`Version B: ${parsedB.error}`);
    return problems.join(' ');
  }, [parsedA, parsedB]);

  const comparison = useMemo(() => {
    if (!parsedA.ok || !parsedB.ok) return null;
    const order = compareSemver(parsedA.v, parsedB.v);
    const symbol = order < 0 ? '<' : order > 0 ? '>' : '=';
    return {
      line: `${parsedA.v.normalized} ${symbol} ${parsedB.v.normalized}`,
      explanation: explainComparison(parsedA.v, parsedB.v),
    };
  }, [parsedA, parsedB]);

  const entries = useMemo(() => splitEntries(listInput), [listInput]);
  const outcome = useMemo(
    () =>
      sortVersions(
        entries.map((entry) => entry.raw),
        descending ? 'desc' : 'asc',
      ),
    [entries, descending],
  );
  const sortedText = outcome.sorted.join('\n');
  // sortVersions numbers the entries it was given; the alert names the line
  // each entry was typed on.
  const physicalLine = (entryLine: number): number => entries[entryLine - 1]?.line ?? entryLine;

  // What the visible pane shows is what a save would write.
  const resultText = mode === 'compare' ? (comparison?.line ?? '') : sortedText;
  usePublishedResult(resultText, mode === 'compare' ? 'Comparison' : 'Sorted versions', 'txt');

  // The sample fills both modes at once, so it is useful whichever pane is up.
  const loadSample = () => {
    setListInput(SEMVER_SAMPLE);
    setVersionA('1.0.0-rc.1');
    setVersionB('1.0.0');
  };

  const copyResult = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      notify(mode === 'compare' ? 'Comparison copied' : 'Sorted versions copied');
    } catch {
      notify('Clipboard unavailable. Select the result and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Semver Tools</h1>
          <p>Compare and sort semantic versions</p>
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
          onValueChange={(v) => setMode((v[0] ?? MODES[0].value) as SemverMode)}
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
          className="wb-button primary"
          disabled={!resultText}
          onClick={() => void copyResult()}
        >
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy result
        </Button>
        {mode === 'sort' ? (
          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              aria-label="Sort descending"
              checked={descending}
              onCheckedChange={(checked) => setDescending(Boolean(checked))}
            />
            Sort descending
          </Label>
        ) : null}
      </div>
      {mode === 'compare' ? (
        <>
          {compareError ? (
            <div className="wb-error-banner" role="alert">
              <strong>Couldn&apos;t parse both versions.</strong>
              <span>{compareError}</span>
            </div>
          ) : null}
          <div className="wb-setting-row">
            <span>
              <strong>Version A</strong>
              <small>Optional leading v; minor and patch default to zero</small>
            </span>
            <Input
              aria-label="Version A"
              value={versionA}
              onChange={(e) => setVersionA(e.target.value)}
              placeholder="1.2.0"
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Version B</strong>
              <small>Optional leading v; minor and patch default to zero</small>
            </span>
            <Input
              aria-label="Version B"
              value={versionB}
              onChange={(e) => setVersionB(e.target.value)}
              placeholder="1.2.0"
            />
          </div>
          {comparison ? (
            <>
              <div className="wb-setting-row">
                <span>
                  <strong>Precedence</strong>
                  <small data-testid="semver-result">{comparison.line}</small>
                </span>
              </div>
              <p className="wb-note" data-testid="semver-explanation">
                {comparison.explanation}
              </p>
            </>
          ) : null}
        </>
      ) : (
        <>
          <p className="wb-note">
            One version per line; spaces and commas also separate entries. Accepted: an optional
            leading v, and 1- or 2-part versions (1.2 reads as 1.2.0). Rejected: four-part versions,
            leading zeros such as 01.2.3, empty identifiers such as 1..2, and negative numbers.
          </p>
          {outcome.invalid.length > 0 ? (
            <div className="wb-error-banner" role="alert">
              <strong>
                {outcome.invalid.length === 1
                  ? 'One entry was skipped.'
                  : `${outcome.invalid.length} entries were skipped.`}
              </strong>
              {outcome.invalid.map((entry) => (
                <span key={`${entry.line}-${entry.raw}`}>
                  Line {physicalLine(entry.line)}: {entry.raw} — {entry.error}
                </span>
              ))}
            </div>
          ) : null}
          <div className="wb-editors">
            <section className="wb-editor-pane" aria-label="Versions panel">
              <div className="wb-pane-header">
                <h2>Versions</h2>
              </div>
              <CodeEditor
                value={listInput}
                onChange={setListInput}
                language="text"
                label="Versions to sort"
                placeholder={'1.0.0\n1.2.3-rc.1\n2.0.0'}
              />
              <div className="wb-pane-footer">
                <span>
                  {entries.length === 0
                    ? 'Waiting for input'
                    : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
                </span>
              </div>
            </section>
            <section className="wb-editor-pane" aria-label="Sorted versions panel">
              <div className="wb-pane-header">
                <h2>Sorted</h2>
                <span className="wb-result-state">{descending ? 'Descending' : 'Ascending'}</span>
              </div>
              <CodeEditor
                value={sortedText}
                readOnly
                language="text"
                label="Sorted versions"
                placeholder="Sorted versions will appear here."
              />
              <div className="wb-pane-footer">
                <span>{sortedText ? `${outcome.sorted.length} versions` : 'Nothing to sort'}</span>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
