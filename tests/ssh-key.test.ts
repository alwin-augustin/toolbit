import { describe, expect, it } from 'vitest';
import { md5Bytes, parseSshKeys } from '@/features/tools/ssh-key-inspector/ssh-key';

/*
 * Real keys generated for this suite with OpenSSH:
 *   ssh-keygen -t ed25519 -N '' -C 'ada@example.com'  -f <tmp>/id_ed25519
 *   ssh-keygen -t rsa -b 3072 -N '' -C 'rsa@example.com' -f <tmp>/id_rsa
 *   ssh-keygen -t ecdsa -b 256 -N '' -C 'ecdsa@example.com' -f <tmp>/id_ecdsa
 * Fingerprints are the ground truth from
 *   ssh-keygen -l -f <file>  (SHA256)  and  ssh-keygen -l -E md5 -f <file> (MD5).
 */
const ED25519_PUB =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL8oc+Q5FlCvwXDCx1F78tVv6Ztt9jeVQT81YyDgGgG7 ada@example.com';
const ED25519_BLOB = 'AAAAC3NzaC1lZDI1NTE5AAAAIL8oc+Q5FlCvwXDCx1F78tVv6Ztt9jeVQT81YyDgGgG7';
const ED25519_SHA256 = 'SHA256:SWc6kcRUL/VsQG3rjO+7i7Nz3Vn0NHpUxI29cTP37uM';
const ED25519_MD5 = '59:8b:04:e9:74:af:3c:50:b7:f1:98:4a:6d:87:4e:e8';

const RSA_PUB =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDCzmAErKf6XC2Sn96VMKhhuDJzUIEQuIkk7KZHyxDoGI4lP0VUnXczMcvZIiZtjw3qFyzQHbOYNnAq5VwiUGwLP+rgtuuX6cnZVZC97VuAlxsF9tohDJV2BvQ+WJNiG4oX06CyybpF/Xh/s1AIKqRJSdEcfKLEKZ2CqKyiRrJm/sD+qJdtU/jZyScES0qgObJfA3zQdM/M+89KLuZpvfbazfHFiXWYA4ZLLP4KynUWi0CdBkNCsBoUOGlP93Tbyv9/FXhD2mTwdXCip4OC2ndO/3HaoXEZ4aQZ8hzHn2B/0hL6uOtJSAPziRYfxqI4Ecrd2riEcuTMByXIBm4ckulZr9FuQAqT1kyj9sTe9gLEYU95PbMti8K+Kk5lkylwwb3HGqeYwS1/5nMVmmp92N2ggfhO+KVcs8zgiQKxFJaINmpEzi6HegCHnWWto1mkgEEW3o86RNFZ74CVe19M6tvwzI2LGOmXiYMp8YkM/T0JmH1oGi8Wtt3S9+6EZlg3MeE= rsa@example.com';
const RSA_SHA256 = 'SHA256:zeegLK3TTF10Rtl8GSvKKp13jVE0cjo/8HixVTJcHOw';
const RSA_MD5 = '26:d8:dd:5c:25:36:32:78:d0:f9:18:d7:67:52:75:c1';

const ECDSA_PUB =
  'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBJvah2xbWiv2kjV4QcykAuQIdpQa2OyqoUBdx+TVr+cgwvbVxu8EpOz6f4zOGpX5X3BDapIdILizTw5mOUpJ7r8= ecdsa@example.com';
const ECDSA_SHA256 = 'SHA256:22ZabLuZ7RCVb0z89nRf0m8dlZmzRX/98EPc5YUe9ig';
const ECDSA_MD5 = '83:6f:80:f4:21:36:74:8e:84:e4:0b:19:6e:9a:20:cf';

/*
 * Security keys need hardware to generate, so this blob is synthetic: its
 * strings are the type, a 32-byte public key (bytes 0x00, 0x07, 0x0e, …), and
 * the application string. Fingerprints are computed over the blob bytes.
 */
const SK_PUB =
  'sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIAAHDhUcIyoxOD9GTVRbYmlwd36FjJOaoaivtr3Ey9LZAAAABHNzaDo= sk@example.com';
const SK_SHA256 = 'SHA256:rvzKrVXd3WfmVcT7imAwHU47QL9XZWy4kOwHApUEfEw';
const SK_MD5 = 'fc:7f:55:1d:5e:11:32:43:0c:6f:96:e9:e9:97:8f:34';

describe('parseSshKeys', () => {
  it('parses a real ed25519 key and matches ssh-keygen ground truth', async () => {
    const results = await parseSshKeys(ED25519_PUB);
    expect(results).toEqual([
      {
        line: 1,
        ok: true,
        type: 'ssh-ed25519',
        bits: 256,
        fingerprintSha256: ED25519_SHA256,
        fingerprintMd5: ED25519_MD5,
        comment: 'ada@example.com',
        options: '',
        isCertificate: false,
        isSecurityKey: false,
      },
    ]);
    expect(results[0].ok ? results[0].fingerprintMd5 : '').toMatch(
      /^([0-9a-f]{2}:){15}[0-9a-f]{2}$/,
    );
  });

  it('derives 3072 bits from the RSA modulus', async () => {
    const results = await parseSshKeys(RSA_PUB);
    expect(results).toEqual([
      {
        line: 1,
        ok: true,
        type: 'ssh-rsa',
        bits: 3072,
        fingerprintSha256: RSA_SHA256,
        fingerprintMd5: RSA_MD5,
        comment: 'rsa@example.com',
        options: '',
        isCertificate: false,
        isSecurityKey: false,
      },
    ]);
  });

  it('derives ECDSA bits from the curve name', async () => {
    const results = await parseSshKeys(ECDSA_PUB);
    expect(results).toEqual([
      {
        line: 1,
        ok: true,
        type: 'ecdsa-sha2-nistp256',
        bits: 256,
        fingerprintSha256: ECDSA_SHA256,
        fingerprintMd5: ECDSA_MD5,
        comment: 'ecdsa@example.com',
        options: '',
        isCertificate: false,
        isSecurityKey: false,
      },
    ]);
  });

  it('reports per-line errors with the input line number and skips blank lines', async () => {
    const malformedBlob = 'AAAAEGFiYw=='; // length prefix 16, only 3 bytes follow
    const text = [
      ED25519_PUB,
      '',
      'not a key at all',
      'ssh-ed25519',
      'ssh-rsa $$$$',
      `ssh-rsa ${ED25519_BLOB} mismatched@example.com`,
      `ssh-ed25519 ${malformedBlob} truncated@example.com`,
      RSA_PUB,
    ].join('\n');
    const results = await parseSshKeys(text);

    expect(results.map((r) => r.line)).toEqual([1, 3, 4, 5, 6, 7, 8]);
    expect(results[0]).toMatchObject({ ok: true, type: 'ssh-ed25519', line: 1 });
    expect(results[1]).toMatchObject({ ok: false, line: 3 });
    expect(results[1].ok === false && results[1].error).toMatch(/key type/i);
    expect(results[2]).toMatchObject({ ok: false, line: 4 });
    expect(results[2].ok === false && results[2].error).toMatch(/base64 key data/i);
    expect(results[3]).toMatchObject({ ok: false, line: 5 });
    expect(results[3].ok === false && results[3].error).toMatch(/valid base64/i);
    expect(results[4]).toMatchObject({ ok: false, line: 6 });
    expect(results[4].ok === false && results[4].error).toMatch(/does not match/i);
    expect(results[5]).toMatchObject({ ok: false, line: 7 });
    expect(results[5].ok === false && results[5].error).toMatch(/malformed/i);
    expect(results[6]).toMatchObject({
      ok: true,
      line: 8,
      type: 'ssh-rsa',
      bits: 3072,
      fingerprintSha256: RSA_SHA256,
    });
  });

  it('tolerates authorized_keys options before the key type', async () => {
    const line = `no-port-forwarding,command="rsync --server" ssh-ed25519 ${ED25519_BLOB} ada@example.com`;
    const results = await parseSshKeys(line);
    expect(results).toEqual([
      {
        line: 1,
        ok: true,
        type: 'ssh-ed25519',
        bits: 256,
        fingerprintSha256: ED25519_SHA256,
        fingerprintMd5: ED25519_MD5,
        comment: 'ada@example.com',
        options: 'no-port-forwarding,command="rsync --server"',
        isCertificate: false,
        isSecurityKey: false,
      },
    ]);
  });

  it('accepts certificate type tokens without decoding internals', async () => {
    const line = `ssh-ed25519-cert-v01@openssh.com ${ED25519_BLOB} ca@example.com`;
    const results = await parseSshKeys(line);
    expect(results).toEqual([
      {
        line: 1,
        ok: true,
        type: 'ssh-ed25519-cert-v01@openssh.com',
        bits: null,
        fingerprintSha256: ED25519_SHA256,
        fingerprintMd5: ED25519_MD5,
        comment: 'ca@example.com',
        options: '',
        isCertificate: true,
        isSecurityKey: false,
      },
    ]);
  });

  it('recognises security key tokens and derives the underlying algorithm bits', async () => {
    const results = await parseSshKeys(SK_PUB);
    expect(results).toEqual([
      {
        line: 1,
        ok: true,
        type: 'sk-ssh-ed25519@openssh.com',
        bits: 256,
        fingerprintSha256: SK_SHA256,
        fingerprintMd5: SK_MD5,
        comment: 'sk@example.com',
        options: '',
        isCertificate: false,
        isSecurityKey: true,
      },
    ]);
  });

  it('returns nothing for empty or blank input', async () => {
    expect(await parseSshKeys('')).toEqual([]);
    expect(await parseSshKeys('\n   \n\t\n')).toEqual([]);
  });
});

describe('md5Bytes', () => {
  it('hashes raw bytes, including values above 0x7f', async () => {
    // Ground truth from node:crypto (OpenSSL MD5) over the same byte vectors.
    expect(md5Bytes(new Uint8Array())).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5Bytes(new TextEncoder().encode('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5Bytes(Uint8Array.of(0x00, 0xff, 0x80, 0xe9))).toBe(
      'e3587c7aad7138ff2a21dc0aaa6fda0b',
    );
  });

  it('pads correctly at the 64-byte block boundary', () => {
    const bytes = Uint8Array.from({ length: 64 }, (_, i) => i);
    expect(md5Bytes(bytes)).toBe('b2d3f56bc197fd985d5965079b5e7148');
  });
});
