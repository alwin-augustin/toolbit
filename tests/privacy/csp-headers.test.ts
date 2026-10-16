import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * T1 coverage for the shipped CSP (`public/_headers`, PRIVACY.md §4.3/§4.4/§7):
 * the policy must reach every route, keep exactly the two user-driven
 * `connect-src` allowances the network tools need, and never grow a
 * hard-coded origin. The runtime half of this contract is the zero-egress
 * spec (T2.1).
 */

// `import.meta.url` is not a file URL under Vite's transform, so resolve
// against the repo root the test runner was started from (npm scripts and CI
// both run from there).
const headersFile = readFileSync(path.resolve(process.cwd(), 'public/_headers'), 'utf8');

interface HeaderBlock {
  path: string;
  headers: Map<string, string>;
}

function parseBlocks(source: string): HeaderBlock[] {
  const blocks: HeaderBlock[] = [];
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (/^\s/.test(line)) {
      const block = blocks[blocks.length - 1];
      const separator = line.indexOf(':');
      if (!block || separator === -1) continue;
      block.headers.set(
        line.slice(0, separator).trim().toLowerCase(),
        line.slice(separator + 1).trim(),
      );
    } else {
      blocks.push({ path: trimmed, headers: new Map() });
    }
  }
  return blocks;
}

const policyBlocks = parseBlocks(headersFile).filter((block) =>
  block.headers.has('content-security-policy'),
);
const policy = policyBlocks[0]?.headers.get('content-security-policy') ?? '';
const directives = new Map(
  policy
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)
    .map((directive) => {
      const [name, ...values] = directive.split(/\s+/);
      return [name, values] as const;
    }),
);

function valuesOf(name: string): string[] {
  return directives.get(name) ?? [];
}

describe('shipped CSP (public/_headers)', () => {
  it('attaches the policy to /* — Cloudflare Pages does not apply a rule on a bare "/", not even for the root URL', () => {
    expect(policyBlocks.map((block) => block.path)).toEqual(['/*']);
  });

  it('never attaches any rule to a bare "/" (production served no headers that way, 2026-10-03 → 16)', () => {
    expect(parseBlocks(headersFile).map((block) => block.path)).not.toContain('/');
  });

  it('keeps every security header inside the /* block so no route can miss one', () => {
    const securityHeaders = [
      'content-security-policy',
      'referrer-policy',
      'x-content-type-options',
      'x-frame-options',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'permissions-policy',
    ];
    const misplaced = parseBlocks(headersFile)
      .filter((block) => block.path !== '/*')
      .flatMap((block) =>
        [...block.headers.keys()].filter((name) => securityHeaders.includes(name)),
      );
    expect(misplaced).toEqual([]);
  });

  it('needs no remote script', () => {
    expect(valuesOf('script-src')).toEqual(["'self'"]);
  });

  it('allows exactly the two user-driven connect-src classes: https: (API builder) and wss: (WS tester)', () => {
    expect(new Set(valuesOf('connect-src'))).toEqual(new Set(["'self'", 'https:', 'wss:']));
  });

  it('never hard-codes an origin and never names the retired capture host', () => {
    expect(policy).not.toMatch(/https?:\/\//);
    expect(policy.toLowerCase()).not.toContain('posthog');
  });

  it('keeps the structural closures', () => {
    expect(valuesOf('default-src')).toEqual(["'self'"]);
    expect(valuesOf('frame-src')).toEqual(["'none'"]);
    expect(valuesOf('object-src')).toEqual(["'none'"]);
    expect(valuesOf('base-uri')).toEqual(["'none'"]);
    expect(valuesOf('frame-ancestors')).toEqual(["'none'"]);
    expect(valuesOf('form-action')).toEqual(["'self'"]);
  });
});
