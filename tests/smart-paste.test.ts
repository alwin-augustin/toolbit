import { describe, expect, it } from 'vitest';
import { detectSmartPaste } from '@/v2/smart-paste';

describe('automatic smart paste routing', () => {
  it('leaves unrecognized text and oversized suggestions alone', () => {
    expect(detectSmartPaste('ordinary words that need no tool')).toBeNull();
    expect(detectSmartPaste('x'.repeat(200001))).toBeNull();
  });
  it.each([
    ['{"ok":true}', 'json-formatter'],
    ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln', 'jwt-decoder'],
    ['SGVsbG8gd29ybGQsIGZyaWVuZA==', 'base64-encoder'],
    ['https://example.com/path', 'url-encoder'],
    ['0 9 * * *', 'cron-parser'],
    ['550e8400-e29b-41d4-a716-446655440000', 'uuid-generator'],
  ])('routes %s to %s', (input, toolId) => {
    expect(detectSmartPaste(input)?.toolId).toBe(toolId);
  });
});
