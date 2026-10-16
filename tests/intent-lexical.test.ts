import { describe, expect, it } from 'vitest';
import { expandTokens, lexicalResolve, matchToken, tokenize } from '@/core/intent/lexical';
import { resolveIntent } from '@/core/intent/resolver';

const top = (query: string) => lexicalResolve(query, { limit: 3 }).suggestions[0]?.toolId;
const ids = (query: string) => lexicalResolve(query, { limit: 8 }).suggestions.map((s) => s.toolId);

describe('intent tokenizer', () => {
  it('splits on non-alphanumerics and lowercases', () => {
    expect(tokenize('Pretty-Print JSON, v2!')).toEqual(['pretty', 'print', 'json', 'v2']);
  });

  it('drops stopwords and expands synonyms', () => {
    expect(expandTokens(tokenize('I want to convert a colour'))).toEqual([
      'convert',
      'colour',
      'color',
    ]);
    expect(expandTokens(tokenize('guid'))).toEqual(['guid', 'uuid']);
  });

  it('keeps stopwords when they are the whole query', () => {
    expect(expandTokens(tokenize('the'))).toEqual(['the']);
  });

  it('matches exact, prefix, stem, and one-edit tokens', () => {
    expect(matchToken('json', 'json')).toBe('exact');
    expect(matchToken('json', 'jsonify')).toBe('prefix');
    expect(matchToken('converter', 'convert')).toBe('prefix');
    expect(matchToken('formatting', 'formatter')).toBe('stem');
    expect(matchToken('jsom', 'json')).toBe('fuzzy');
    expect(matchToken('xyzzy', 'json')).toBeNull();
  });
});

describe('lexical resolution', () => {
  it('finds tools by task phrasing, not just name', () => {
    expect(top('make json readable')).toBe('json-formatter');
    expect(top('pretty print this json')).toBe('json-formatter');
    expect(top('why is my token expired')).toBe('jwt-decoder');
    expect(top('convert yaml to json')).toBe('yaml-formatter');
    expect(top('days between two dates')).toBe('date-calculator');
    expect(top('what does http 404 mean')).toBe('http-status-codes');
  });

  it('tolerates typos on names', () => {
    expect(top('jsom formatter')).toBe('json-formatter');
    expect(ids('jsom formatter')[0]).toBe('json-formatter');
  });

  it('resolves british spellings and aliases', () => {
    expect(top('colour converter')).toBe('color-converter');
    expect(top('guid')).toBe('uuid-generator');
    expect(top('epoch')).toBe('timestamp-converter');
  });

  it('always ranks the exact name first', () => {
    expect(top('json formatter')).toBe('json-formatter');
    expect(top('base64 encoder')).toBe('base64-encoder');
    expect(top('crontab generator')).toBe('crontab-generator');
  });

  it('returns an empty resolution for gibberish', () => {
    const resolution = resolveIntent('xyzzy frobnicate');
    expect(resolution.suggestions).toEqual([]);
    expect(resolution.confident).toBe(false);
    expect(resolution.resolvedBy).toBe('none');
  });

  it('marks ambiguous queries as not confident', () => {
    const resolution = resolveIntent('format');
    expect(resolution.suggestions.length).toBeGreaterThan(1);
    expect(resolution.confident).toBe(false);
  });

  it('marks a clear winner as confident', () => {
    const resolution = resolveIntent('decode a jwt');
    expect(resolution.confident).toBe(true);
    expect(resolution.suggestions[0]?.toolId).toBe('jwt-decoder');
  });

  it('explains why a tool is suggested', () => {
    const [first] = lexicalResolve('make json readable').suggestions;
    expect(first?.reasons.length).toBeGreaterThan(0);
    expect(first?.reasons[0]).toContain('json');
  });

  it('never suggests a tool outside the catalogue', async () => {
    const { TOOLS } = await import('@/content/tools.config');
    const known = new Set(TOOLS.map((tool) => tool.id));
    for (const suggestion of lexicalResolve('convert validate format decode', { limit: 20 })
      .suggestions)
      expect(known.has(suggestion.toolId), suggestion.toolId).toBe(true);
  });
});
