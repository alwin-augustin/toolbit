import { describe, expect, it } from 'vitest';
import {
  HMAC_SAMPLE_KEY,
  HMAC_SAMPLE_MESSAGE,
  computeHmac,
  signatureMatches,
} from '@/features/tools/hmac-generator/HmacScreen';

/** RFC 4231 case 1: a 20-byte key of 0x0b and the message "Hi There". */
const RFC_KEY = '\u000b'.repeat(20);
const RFC_MESSAGE = 'Hi There';

async function rfcSignature(algorithm: string): Promise<{ hex: string; base64: string }> {
  const result = await computeHmac(RFC_MESSAGE, RFC_KEY, algorithm);
  if (!result.ok) throw new Error(`expected a signature for ${algorithm}`);
  return result;
}

/** Same 32 bytes as the RFC 4231 SHA-256 hex, in the other encoding. */
const SHA256_VECTOR = {
  hex: 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
  base64: 'sDRMYdjbOFNcqK/OrwvxK4gdwgDJgz2nJuk3bC4yz/c=',
};

describe('hmac signatures', () => {
  it('matches the RFC 4231 SHA-1 vector', async () => {
    expect((await rfcSignature('SHA-1')).hex).toBe('b617318655057264e28bc0b6fb378c8ef146be00');
  });

  it('matches the RFC 4231 SHA-256 vector in both encodings', async () => {
    expect(await computeHmac(RFC_MESSAGE, RFC_KEY, 'SHA-256')).toEqual({
      ok: true,
      hex: SHA256_VECTOR.hex,
      base64: SHA256_VECTOR.base64,
    });
  });

  it('matches the RFC 4231 SHA-384 vector', async () => {
    expect((await rfcSignature('SHA-384')).hex).toBe(
      'afd03944d84895626b0825f4ab46907f15f9dadbe4101ec682aa034c7cebc59cfaea9ea9076ede7f4af152e8b2fa9cb6',
    );
  });

  it('matches the RFC 4231 SHA-512 vector', async () => {
    expect((await rfcSignature('SHA-512')).hex).toBe(
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
    );
  });

  it('rejects an algorithm it cannot sign with', async () => {
    expect(await computeHmac(RFC_MESSAGE, RFC_KEY, 'MD5')).toEqual({ ok: false });
    expect(await computeHmac(RFC_MESSAGE, RFC_KEY, 'sha-256')).toEqual({ ok: false });
  });

  it('signs the exported sample', async () => {
    const result = await computeHmac(HMAC_SAMPLE_MESSAGE, HMAC_SAMPLE_KEY, 'SHA-256');
    if (!result.ok) throw new Error('expected a signature for the sample');
    expect(result.hex).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('signature comparison', () => {
  it('accepts upper-case and colon-separated hex', () => {
    expect(
      signatureMatches(
        'B0:34:4C:61:D8:DB:38:53:5C:A8:AF:CE:AF:0B:F1:2B:88:1D:C2:00:C9:83:3D:A7:26:E9:37:6C:2E:32:CF:F7',
        SHA256_VECTOR,
      ),
    ).toBe(true);
    expect(signatureMatches(SHA256_VECTOR.hex.toUpperCase(), SHA256_VECTOR)).toBe(true);
  });

  it('accepts the base64 form', () => {
    expect(signatureMatches(SHA256_VECTOR.base64, SHA256_VECTOR)).toBe(true);
  });

  it('ignores whitespace around pasted values', () => {
    expect(signatureMatches(`  ${SHA256_VECTOR.hex}\n`, SHA256_VECTOR)).toBe(true);
    expect(signatureMatches(` ${SHA256_VECTOR.base64}\n`, SHA256_VECTOR)).toBe(true);
  });

  it('rejects empty, truncated, and unrelated values', () => {
    expect(signatureMatches('', SHA256_VECTOR)).toBe(false);
    expect(signatureMatches(SHA256_VECTOR.hex.slice(0, 31), SHA256_VECTOR)).toBe(false);
    expect(signatureMatches('not-a-signature', SHA256_VECTOR)).toBe(false);
    expect(signatureMatches(SHA256_VECTOR.base64.replace(/=$/, ''), SHA256_VECTOR)).toBe(false);
  });
});
