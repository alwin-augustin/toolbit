import { describe, expect, it } from 'vitest';
import {
  PASSWORD_CHARSETS,
  buildPasswordCharset,
  calculatePasswordStrength,
  createPassword,
  generatePasswords,
} from '@/features/tools/password-generator/PasswordScreen';
import {
  base32Decode,
  generateTotpForTime,
  totpCounter,
  totpTimeLeft,
} from '@/features/tools/totp-generator/TotpScreen';
import {
  CERT_SAMPLE_PEM,
  decodeCertificate,
  pemToArrayBuffer,
} from '@/features/tools/certificate-decoder/CertScreen';
import {
  buildVCard,
  buildWifiString,
  generateQrDataUrl,
  generateQrSvg,
  getQrContent,
} from '@/features/tools/qr-code-generator/QrScreen';

describe('password helpers', () => {
  it('builds the full 92-character set when all types are on', () => {
    const charset = buildPasswordCharset({
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    expect(charset).toHaveLength(92);
    expect(charset).toContain(PASSWORD_CHARSETS.lowercase);
    expect(charset).toContain(PASSWORD_CHARSETS.uppercase);
    expect(charset).toContain(PASSWORD_CHARSETS.numbers);
    expect(charset).toContain(PASSWORD_CHARSETS.symbols);
  });

  it('omits deselected character types', () => {
    const charset = buildPasswordCharset({
      includeLowercase: true,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(charset).toBe(PASSWORD_CHARSETS.lowercase);
    expect(
      buildPasswordCharset({
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
      }),
    ).toBe('');
  });

  it('maps seeded random values through the charset', () => {
    expect(createPassword('abc', 5, [0, 1, 2, 0, 1])).toBe('abcab');
    expect(createPassword('ab', 3, [5, 6, 7])).toBe('bab');
  });

  it('rejects an empty charset', () => {
    expect(() => createPassword('', 8, [1, 2, 3])).toThrow('at least one character type');
  });

  it('generates the requested count and length from a seeded source', () => {
    const passwords = generatePasswords('xyz', 3, 2, (n) => new Uint32Array(n).fill(0));
    expect(passwords).toEqual(['xxx', 'xxx']);
    const varied = generatePasswords('ab', 4, 3, (n) =>
      Uint32Array.from({ length: n }, (_, i) => i),
    );
    expect(varied).toEqual(['abab', 'abab', 'abab']);
    for (const password of varied) expect(password).toHaveLength(4);
  });

  it('scores the legacy strength bands', () => {
    expect(calculatePasswordStrength('abc').label).toBe('Weak');
    expect(calculatePasswordStrength('Abcdefgh').label).toBe('Medium');
    expect(calculatePasswordStrength('Aa1!Aa1!Aa1!').label).toBe('Strong');
    expect(calculatePasswordStrength('Abcdefgh123!@#XYZpq').label).toBe('Very Strong');
  });
});

describe('totp helpers', () => {
  it('decodes base32 case-insensitively and rejects bad characters', () => {
    expect(base32Decode('MY======')).toEqual(new Uint8Array([0x66]));
    expect(base32Decode('my')).toEqual(new Uint8Array([0x66]));
    expect(base32Decode('JBSWY3DPEHPK3PXP')).toHaveLength(10);
    expect(() => base32Decode('!!!')).toThrow('Invalid Base32');
  });

  it('computes counters and countdowns', () => {
    expect(totpCounter(30, 59)).toBe(1);
    expect(totpCounter(30, 60)).toBe(2);
    expect(totpTimeLeft(30, 59)).toBe(1);
    expect(totpTimeLeft(30, 60)).toBe(30);
    expect(totpTimeLeft(30, 0)).toBe(30);
  });

  it('matches the RFC 6238 SHA-1 vectors', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    expect(await generateTotpForTime(secret, 8, 30, 59)).toBe('94287082');
    expect(await generateTotpForTime(secret, 8, 30, 1111111109)).toBe('07081804');
    expect(await generateTotpForTime(secret, 8, 30, 1111111111)).toBe('14050471');
    expect(await generateTotpForTime(secret, 8, 30, 1234567890)).toBe('89005924');
    expect(await generateTotpForTime(secret, 8, 30, 2000000000)).toBe('69279037');
  });
});

describe('certificate helpers', () => {
  it('rejects empty PEM input', () => {
    expect(() => pemToArrayBuffer('')).toThrow('Invalid PEM');
  });

  it('decodes the fixture PEM', async () => {
    const info = await decodeCertificate(CERT_SAMPLE_PEM, new Date('2028-06-01T00:00:00Z'));
    expect(info.subject['CN']).toBe('example.com');
    expect(info.subject['O']).toBe('Example Org');
    expect(info.issuer['CN']).toBe('example.com');
    expect(info.sans).toContain('example.com');
    expect(info.sans).toContain('www.example.com');
    expect(info.notBefore).toBe('2026-10-02T15:57:14.000Z');
    expect(info.notAfter).toBe('2036-09-29T15:57:14.000Z');
    expect(info.validityStatus).toBe('valid');
    expect(info.fingerprints.sha1).toMatch(/^([0-9A-F]{2}:){19}[0-9A-F]{2}$/);
    expect(info.fingerprints.sha256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });

  it('reports expiry against the clock', async () => {
    const expired = await decodeCertificate(CERT_SAMPLE_PEM, new Date('2040-01-01T00:00:00Z'));
    expect(expired.validityStatus).toBe('expired');
    const early = await decodeCertificate(CERT_SAMPLE_PEM, new Date('2020-01-01T00:00:00Z'));
    expect(early.validityStatus).toBe('not_yet_valid');
  });

  it('rejects garbage input', async () => {
    await expect(decodeCertificate('not a certificate')).rejects.toThrow();
  });
});

describe('qr helpers', () => {
  it('builds wifi and vcard payloads', () => {
    expect(buildWifiString('MyNet', 'secret', 'WPA')).toBe('WIFI:T:WPA;S:MyNet;P:secret;;');
    const vcard = buildVCard('John Doe', '+1234', 'john@example.com');
    expect(vcard).toContain('BEGIN:VCARD');
    expect(vcard).toContain('FN:John Doe');
    expect(vcard).toContain('TEL:+1234');
    expect(vcard).toContain('EMAIL:john@example.com');
  });

  it('selects content per mode', () => {
    const base = {
      text: 'hi',
      url: 'https://example.com',
      wifiSsid: 'Net',
      wifiPassword: 'pw',
      wifiEncryption: 'WPA',
      vcardName: 'Ada',
      vcardPhone: '1',
      vcardEmail: 'a@x.dev',
    };
    expect(getQrContent('text', base)).toBe('hi');
    expect(getQrContent('url', base)).toBe('https://example.com');
    expect(getQrContent('wifi', base)).toBe('WIFI:T:WPA;S:Net;P:pw;;');
    expect(getQrContent('vcard', base)).toContain('FN:Ada');
  });

  it('generates PNG and SVG output', async () => {
    const dataUrl = await generateQrDataUrl('hello', 256, 'M');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
    const svg = await generateQrSvg('hello', 256, 'M');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });
});
