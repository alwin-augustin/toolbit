/**
 * JSONPath subset for the JSON formatter's Query mode.
 *
 * Supported: `$` root, `.key`, `['key']`, `[0]` (negative counts from the
 * end), `[start:end]` slices, `[*]`, `.*`, and `..key` / `..*` recursive
 * descent. Filters (`[?(...)]`) and unions are rejected with a located error
 * rather than silently mismatching, so nobody trusts a query it did not run.
 *
 * Like `jsonpath-plus`, a name applied to an array iterates the array (`.orders.id`
 * walks every order), so `[*]` is optional in the common case.
 */

export interface JsonPathMatch {
  /** Concrete path to the match, e.g. `$.orders[0].id`. */
  path: string;
  value: unknown;
}

export type JsonPathResult =
  | { ok: true; matches: JsonPathMatch[] }
  | { ok: false; error: string };

type Segment =
  | { kind: 'name'; name: string }
  | { kind: 'index'; index: number }
  | { kind: 'slice'; start?: number; end?: number }
  | { kind: 'wildcard' }
  | { kind: 'recursive'; name: string | null };

const NAME_CHARS = /[^.\[\]]/;

function parseSegments(path: string): Segment[] | { error: string } {
  const segments: Segment[] = [];
  let i = 0;
  const source = path.trim();
  if (source.startsWith('$')) i = 1;

  const readName = (): string => {
    let name = '';
    while (i < source.length && NAME_CHARS.test(source[i])) {
      name += source[i];
      i++;
    }
    return name;
  };

  while (i < source.length) {
    const char = source[i];
    if (char === '.') {
      i++;
      if (source[i] === '.') {
        i++;
        if (source[i] === '*') {
          i++;
          segments.push({ kind: 'recursive', name: null });
        } else {
          const name = readName();
          if (!name) return { error: `Expected a key after ".." at position ${i + 1}.` };
          segments.push({ kind: 'recursive', name });
        }
      } else if (source[i] === '*') {
        i++;
        segments.push({ kind: 'wildcard' });
      } else {
        const name = readName();
        if (!name) return { error: `Expected a key after "." at position ${i + 1}.` };
        segments.push({ kind: 'name', name });
      }
      continue;
    }
    if (char === '[') {
      const close = source.indexOf(']', i);
      if (close === -1) return { error: 'Missing closing "]" in the path.' };
      const raw = source.slice(i + 1, close).trim();
      i = close + 1;
      if (raw === '*') {
        segments.push({ kind: 'wildcard' });
        continue;
      }
      const quoted = /^(['"])(.*)\1$/.exec(raw);
      if (quoted) {
        segments.push({ kind: 'name', name: quoted[2] });
        continue;
      }
      const slice = /^(-?\d*)\s*:\s*(-?\d*)$/.exec(raw);
      if (slice) {
        segments.push({
          kind: 'slice',
          ...(slice[1] !== '' ? { start: Number(slice[1]) } : {}),
          ...(slice[2] !== '' ? { end: Number(slice[2]) } : {}),
        });
        continue;
      }
      if (/^-?\d+$/.test(raw)) {
        segments.push({ kind: 'index', index: Number(raw) });
        continue;
      }
      if (raw.startsWith('?')) {
        return { error: 'Filter expressions ([?(...)]) are not supported. Use [*] with a key path instead.' };
      }
      return { error: `Unsupported segment "[${raw}]". Use a key, an index, a slice, or [*].` };
    }
    if (i === 0) {
      const name = readName();
      if (!name) return { error: `Unexpected character "${char}" at position ${i + 1}.` };
      segments.push({ kind: 'name', name });
      continue;
    }
    return { error: `Unexpected character "${char}" at position ${i + 1}.` };
  }
  return segments;
}

function appendPath(base: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${base}.${key}` : `${base}['${key}']`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function wildcardChildren(match: JsonPathMatch): JsonPathMatch[] {
  if (Array.isArray(match.value)) {
    return match.value.map((item, index) => ({ path: `${match.path}[${index}]`, value: item }));
  }
  if (isRecord(match.value)) {
    return Object.entries(match.value).map(([key, value]) => ({
      path: appendPath(match.path, key),
      value,
    }));
  }
  return [];
}

function applyName(match: JsonPathMatch, name: string, out: JsonPathMatch[]): void {
  if (Array.isArray(match.value)) {
    for (const child of wildcardChildren(match)) applyName(child, name, out);
    return;
  }
  if (isRecord(match.value) && Object.prototype.hasOwnProperty.call(match.value, name)) {
    out.push({ path: appendPath(match.path, name), value: match.value[name] });
  }
}

function applyIndex(match: JsonPathMatch, index: number, out: JsonPathMatch[]): void {
  if (!Array.isArray(match.value)) return;
  const resolved = index < 0 ? match.value.length + index : index;
  if (resolved >= 0 && resolved < match.value.length) {
    out.push({ path: `${match.path}[${resolved}]`, value: match.value[resolved] });
  }
}

function applySlice(match: JsonPathMatch, start: number | undefined, end: number | undefined): JsonPathMatch[] {
  if (!Array.isArray(match.value)) return [];
  const length = match.value.length;
  const from = start === undefined ? 0 : start < 0 ? Math.max(0, length + start) : Math.min(start, length);
  const to = end === undefined ? length : end < 0 ? Math.max(0, length + end) : Math.min(end, length);
  const out: JsonPathMatch[] = [];
  for (let index = from; index < to; index++) {
    out.push({ path: `${match.path}[${index}]`, value: match.value[index] });
  }
  return out;
}

function recursiveChildren(match: JsonPathMatch): Array<{ key: string | null; child: JsonPathMatch }> {
  if (Array.isArray(match.value)) {
    return wildcardChildren(match).map((child) => ({ key: null, child }));
  }
  if (isRecord(match.value)) {
    return Object.entries(match.value).map(([key, value]) => ({
      key,
      child: { path: appendPath(match.path, key), value },
    }));
  }
  return [];
}

function applyRecursive(match: JsonPathMatch, name: string | null, out: JsonPathMatch[]): void {
  const visit = (node: JsonPathMatch): void => {
    for (const { key, child } of recursiveChildren(node)) {
      if (name === null || key === name) out.push(child);
      visit(child);
    }
  };
  visit(match);
}

/** Evaluate a JSONPath subset against a parsed JSON value. */
export function queryJsonPath(value: unknown, path: string): JsonPathResult {
  if (!path.trim()) return { ok: false, error: 'Enter a path, such as $.orders[*].id.' };
  const parsed = parseSegments(path);
  if ('error' in parsed) return { ok: false, error: parsed.error };

  let current: JsonPathMatch[] = [{ path: '$', value }];
  for (const segment of parsed) {
    const next: JsonPathMatch[] = [];
    for (const match of current) {
      switch (segment.kind) {
        case 'name':
          applyName(match, segment.name, next);
          break;
        case 'index':
          applyIndex(match, segment.index, next);
          break;
        case 'slice':
          next.push(...applySlice(match, segment.start, segment.end));
          break;
        case 'wildcard':
          next.push(...wildcardChildren(match));
          break;
        case 'recursive':
          applyRecursive(match, segment.name, next);
          break;
      }
    }
    current = next;
  }
  return { ok: true, matches: current };
}
