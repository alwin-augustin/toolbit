import { describe, expect, it } from 'vitest';
import {
  URL_PARSER_SAMPLE,
  parseUrl,
  queryToObject,
} from '@/features/tools/url-parser/UrlParserScreen';

/** Parse, asserting success: a regression should read as a failure, not a crash. */
function requireOk(input: string) {
  const outcome = parseUrl(input);
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

describe('parseUrl', () => {
  it('ships the documented sample URL', () => {
    expect(URL_PARSER_SAMPLE).toBe(
      'https://user:pass@api.example.com:8443/v2/orders/1042?status=paid&tags=a,b&tags=c#receipt',
    );
  });

  it('parses every component of the sample URL', () => {
    const value = requireOk(URL_PARSER_SAMPLE);
    expect(value.protocol).toBe('https:');
    expect(value.username).toBe('user');
    expect(value.password).toBe('pass');
    expect(value.hostname).toBe('api.example.com');
    expect(value.port).toBe('8443');
    expect(value.path).toBe('/v2/orders/1042');
    expect(value.pathSegments).toEqual(['v2', 'orders', '1042']);
    expect(value.fragment).toBe('#receipt');
    expect(value.origin).toBe('https://api.example.com:8443');
  });

  it('keeps query occurrences in order, repeats included', () => {
    const { query } = requireOk(URL_PARSER_SAMPLE);
    expect(query).toHaveLength(3);
    expect(query).toEqual([
      { name: 'status', value: 'paid', raw: 'status=paid', rawName: 'status' },
      { name: 'tags', value: 'a,b', raw: 'tags=a,b', rawName: 'tags' },
      { name: 'tags', value: 'c', raw: 'tags=c', rawName: 'tags' },
    ]);
  });

  it('decodes + as a space and keeps the pair raw', () => {
    const { query } = requireOk('https://example.com/search?q=hello+world');
    expect(query).toEqual([
      { name: 'q', value: 'hello world', raw: 'q=hello+world', rawName: 'q' },
    ]);
  });

  it('percent-decodes unicode in names and values', () => {
    const { query } = requireOk('https://example.com/?currency=%E2%82%AC&na%20me=v%2Fal');
    expect(query[0]).toEqual({
      name: 'currency',
      value: '€',
      raw: 'currency=%E2%82%AC',
      rawName: 'currency',
    });
    expect(query[1].name).toBe('na me');
    expect(query[1].value).toBe('v/al');
  });

  it('reports the protocol default port only for http and https', () => {
    const https = requireOk('https://example.com/a');
    expect(https.port).toBe('');
    expect(https.portDefault).toBe('443');
    const http = requireOk('http://example.com/a');
    expect(http.port).toBe('');
    expect(http.portDefault).toBe('80');
    // ws and other schemes get no default this tool is willing to claim.
    const ws = requireOk('ws://example.com/socket');
    expect(ws.port).toBe('');
    expect(ws.portDefault).toBe('');
    // The default describes the protocol, so it stays known even with a port.
    expect(requireOk('https://example.com:8443/a').portDefault).toBe('443');
  });

  it('parses a URL that ends at a fragment', () => {
    const value = requireOk('https://x.dev#top');
    expect(value.path).toBe('/');
    expect(value.pathSegments).toEqual([]);
    expect(value.fragment).toBe('#top');
    expect(value.query).toEqual([]);
  });

  it('rejects input the URL constructor rejects', () => {
    const notAUrl = parseUrl('not a url');
    expect(notAUrl.ok).toBe(false);
    if (!notAUrl.ok) expect(notAUrl.error).toMatch(/invalid url/i);
    expect(parseUrl('').ok).toBe(false);
    expect(parseUrl('   ').ok).toBe(false);
    // A protocol-relative URL needs a base, and this tool deliberately has none.
    expect(parseUrl('//example.com/x').ok).toBe(false);
  });
});

describe('queryToObject', () => {
  it('groups the sample query, repeats becoming arrays in order', () => {
    expect(queryToObject(requireOk(URL_PARSER_SAMPLE).query)).toEqual({
      status: 'paid',
      tags: ['a,b', 'c'],
    });
  });

  it('gives a single occurrence a string and repeats an array', () => {
    expect(
      queryToObject([
        { name: 'tags', value: 'a' },
        { name: 'status', value: 'paid' },
        { name: 'tags', value: 'b' },
        { name: 'tags', value: 'c' },
      ]),
    ).toEqual({ tags: ['a', 'b', 'c'], status: 'paid' });
  });

  it('keeps an empty value rather than dropping the name', () => {
    expect(queryToObject([{ name: 'flag', value: '' }])).toEqual({ flag: '' });
  });

  it('returns an empty object for an empty query', () => {
    expect(queryToObject([])).toEqual({});
  });

  it('stores a __proto__ name instead of letting it vanish', () => {
    const object = queryToObject([{ name: '__proto__', value: 'x' }]);
    expect(Object.keys(object)).toEqual(['__proto__']);
    expect(object['__proto__']).toBe('x');
  });
});
