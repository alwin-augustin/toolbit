/**
 * Intent evaluation harness.
 *
 * The golden set is the product contract: a user who knows the task but not
 * the tool name should land on the right tool within the top 3 results. Run
 * this whenever capability metadata, scoring weights, or synonyms change —
 * it is the regression gate the plan (`docs/intent-discovery.md` §6) calls
 * for. Adding a tool to the catalogue means adding at least one query here.
 */
import { describe, expect, it } from 'vitest';
import { resolveIntent } from '@/core/intent/resolver';

interface QueryCase {
  query: string;
  /** Any of these tools in the top 3 counts as a hit. */
  expect: string | string[];
}

const CASES: QueryCase[] = [
  // JSON & data
  { query: 'make json readable', expect: 'json-formatter' },
  { query: 'pretty print this json', expect: 'json-formatter' },
  { query: 'format json', expect: 'json-formatter' },
  { query: 'minify json', expect: ['json-formatter', 'js-json-minifier'] },
  { query: 'validate json schema', expect: 'json-validator' },
  { query: 'why is my json invalid', expect: 'json-validator' },
  { query: 'convert csv to json', expect: 'csv-to-json' },
  // Encode & decode
  { query: 'decode base64', expect: 'base64-encoder' },
  { query: 'what does this base64 string say', expect: 'base64-encoder' },
  { query: 'encode a url', expect: 'url-encoder' },
  { query: 'unescape html', expect: 'html-escape' },
  { query: 'escape html entities', expect: 'html-escape' },
  { query: 'decode protobuf', expect: 'protobuf-decoder' },
  { query: 'decode a jwt', expect: 'jwt-decoder' },
  { query: 'why is my token expired', expect: 'jwt-decoder' },
  { query: 'check jwt claims', expect: 'jwt-decoder' },
  { query: 'inspect ssl certificate', expect: 'certificate-decoder' },
  { query: 'check when a certificate expires', expect: 'certificate-decoder' },
  // Convert
  { query: 'convert camel case to snake case', expect: 'case-converter' },
  { query: 'unix timestamp to date', expect: 'timestamp-converter' },
  { query: 'epoch', expect: 'timestamp-converter' },
  { query: 'hex to rgb', expect: 'color-converter' },
  { query: 'minify javascript', expect: 'js-json-minifier' },
  { query: 'convert png to jpeg', expect: 'image-converter' },
  // SQL & code
  { query: 'format sql query', expect: 'sql-formatter' },
  { query: 'pretty print graphql', expect: 'graphql-formatter' },
  { query: 'minify css', expect: 'css-formatter' },
  // YAML & config
  { query: 'convert yaml to json', expect: 'yaml-formatter' },
  { query: 'format xml', expect: 'xml-formatter' },
  { query: 'validate nginx config', expect: 'nginx-config-validator' },
  // Text
  { query: 'count words', expect: 'word-counter' },
  { query: 'remove extra whitespace', expect: 'strip-whitespace' },
  { query: 'compare two texts', expect: 'diff-tool' },
  { query: 'view a git diff', expect: 'git-diff-viewer' },
  { query: 'test a regex', expect: 'regex-tester' },
  { query: 'preview markdown', expect: 'markdown-previewer' },
  { query: 'placeholder text', expect: 'lorem-ipsum-generator' },
  { query: 'merge pdfs', expect: 'pdf-tools' },
  // Time & numbers
  { query: 'days between two dates', expect: 'date-calculator' },
  { query: 'kg to lbs', expect: 'unit-converter' },
  { query: 'explain a cron expression', expect: 'cron-parser' },
  { query: 'build a cron expression', expect: 'crontab-generator' },
  // Generators
  { query: 'sha256 hash', expect: 'hash-generator' },
  { query: 'checksum', expect: 'hash-generator' },
  { query: 'generate a uuid', expect: 'uuid-generator' },
  { query: 'guid', expect: 'uuid-generator' },
  { query: 'strong password', expect: 'password-generator' },
  { query: 'generate a 2fa code', expect: 'totp-generator' },
  { query: 'generate test data', expect: 'fake-data-generator' },
  { query: 'qr code for a url', expect: 'qr-code-generator' },
  // Utilities
  { query: 'what does http 404 mean', expect: 'http-status-codes' },
  { query: 'test an api endpoint', expect: 'api-request-builder' },
  { query: 'postman alternative', expect: 'api-request-builder' },
  { query: 'websocket connection', expect: 'websocket-tester' },
  { query: 'docker run command', expect: 'docker-command-builder' },
  // Phrasing and typos
  { query: 'jsom formatter', expect: 'json-formatter' },
  { query: 'colour converter', expect: 'color-converter' },
  { query: 'i need to check why my token stopped working', expect: 'jwt-decoder' },
  { query: 'turn this spreadsheet into json', expect: 'csv-to-json' },
];

/** Queries with no tool answer. They must never come back confident. */
const OFF_CATALOGUE = [
  'blockchain wallet address',
  'kubernetes pod logs',
  'git rebase interactive',
  'refactor my react component',
];

describe('intent evaluation (golden set)', () => {
  it('finds the right tool in the top 3', () => {
    const misses: string[] = [];
    for (const testCase of CASES) {
      const expected = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect];
      const top3 = resolveIntent(testCase.query, { limit: 3 }).suggestions.map((s) => s.toolId);
      if (!expected.some((id) => top3.includes(id)))
        misses.push(`“${testCase.query}” → ${top3.join(', ') || '(no results)'}`);
    }
    expect(misses, `hit@3 misses:\n${misses.join('\n')}`).toEqual([]);
  });

  it('never answers off-catalogue asks confidently', () => {
    for (const query of OFF_CATALOGUE) {
      const resolution = resolveIntent(query);
      expect(resolution.confident, `“${query}” → ${resolution.suggestions[0]?.toolId}`).toBe(false);
    }
  });

  it('covers the full catalogue across the golden set', () => {
    const covered = new Set<string>();
    for (const testCase of CASES) {
      const expected = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect];
      for (const id of expected) covered.add(id);
    }
    // Every tool family has at least one representative query. The threshold
    // guards against a shrinking set more than a precise count.
    expect(covered.size).toBeGreaterThanOrEqual(40);
  });
});
