/**
 * Parse SSH public keys.
 *
 * A line is `[options ]type blob [comment]` — the format `authorized_keys`
 * accepts and `ssh-keygen` writes. The blob is a sequence of big-endian
 * length-prefixed byte strings: the algorithm name, then the material for that
 * algorithm. Fingerprints are taken over the raw blob bytes, exactly as
 * `ssh-keygen -l` and `ssh-keygen -l -E md5` compute them.
 */

/** One successfully parsed key line. */
export interface SshKeyParsed {
  line: number;
  ok: true;
  /** The type token exactly as written on the line. */
  type: string;
  /** Key size, when the algorithm's material reveals it. */
  bits: number | null;
  fingerprintSha256: string;
  fingerprintMd5: string;
  comment: string;
  /** authorized_keys options that preceded the key type, verbatim. */
  options: string;
  isCertificate: boolean;
  isSecurityKey: boolean;
}

/** A non-blank line that is not a usable public key. */
export interface SshKeyError {
  line: number;
  ok: false;
  error: string;
}

export type SshKeyParseResult = SshKeyParsed | SshKeyError;

const CERT_SUFFIX = '-cert-v01@openssh.com';

/** Curve name (the first blob string of an ECDSA key) to key size in bits. */
const CURVE_BITS: Record<string, number> = {
  nistp256: 256,
  nistp384: 384,
  nistp521: 521,
};

/** Only a token with one of these prefixes can name a key type, not an option. */
function isKeyTypeToken(token: string): boolean {
  return /^(ssh-|sk-|ecdsa-|webauthn-)/.test(token);
}

/**
 * Whitespace tokens, except inside double quotes: an authorized_keys option may
 * quote a value that contains spaces, e.g. command="rsync --server".
 */
function splitLine(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && /\s/.test(ch)) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

/** Strict base64, tolerating stripped `=` padding but not stray characters. */
function base64ToBytes(text: string): Uint8Array<ArrayBuffer> | null {
  const cleaned = text.replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]+$/.test(cleaned) || cleaned.length % 4 === 1) return null;
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Split a blob into its strings; null when the length prefixes run past the end. */
function readBlobStrings(bytes: Uint8Array): Uint8Array[] | null {
  const strings: Uint8Array[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 4 > bytes.length) return null;
    const length =
      ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    offset += 4;
    if (offset + length > bytes.length) return null;
    strings.push(bytes.subarray(offset, offset + length));
    offset += length;
  }
  return strings.length > 0 ? strings : null;
}

/**
 * Bit length of an mpint's magnitude: drop one 0x00 sign byte, skip any further
 * leading zeros, then subtract the zero bits of the first significant byte.
 */
function mpintBitLength(bytes: Uint8Array): number {
  let start = bytes.length > 0 && bytes[0] === 0 ? 1 : 0;
  while (start < bytes.length && bytes[start] === 0) start += 1;
  if (start === bytes.length) return 0;
  return (bytes.length - start) * 8 - (Math.clz32(bytes[start]) - 24);
}

/**
 * Key size from the algorithm name and blob strings. Certificate blobs use a
 * different layout, so their size is left null rather than decoding internals.
 */
function deriveBits(type: string, strings: Uint8Array[] | null): number | null {
  if (!strings || type.endsWith(CERT_SUFFIX)) return null;
  const base = type.startsWith('sk-') ? type.slice(3).replace(/@openssh\.com$/, '') : type;
  // The blob's first string is the type again; the key material follows it.
  const material = strings.slice(1);
  if (base === 'ssh-ed25519') {
    return material.length > 0 && material[0].length === 32 ? 256 : null;
  }
  if (base === 'ssh-rsa') {
    return material.length > 1 ? mpintBitLength(material[1]) : null;
  }
  if (base.startsWith('ecdsa-sha2-')) {
    const curve = material.length > 0 ? new TextDecoder().decode(material[0]) : '';
    return CURVE_BITS[curve] ?? null;
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Lowercase MD5 hex joined as byte pairs, the form `ssh-keygen -E md5` prints. */
function colonHex(hex: string): string {
  return (hex.match(/../g) ?? []).join(':');
}

// Adapted from HashScreen's MD5; operates on raw bytes for SSH fingerprints.
export function md5Bytes(bytes: Uint8Array): string {
  const k = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]);
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const message = Array.from(bytes);
  const bitLen = message.length * 8;
  message.push(0x80);
  while (message.length % 64 !== 56) message.push(0);
  for (let i = 0; i < 8; i++) message.push(Math.floor(bitLen / 2 ** (i * 8)) & 0xff);
  let a0 = 0x67452301 >>> 0,
    b0 = 0xefcdab89 >>> 0,
    c0 = 0x98badcfe >>> 0,
    d0 = 0x10325476 >>> 0;
  for (let offset = 0; offset < message.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++)
      M[j] =
        message[offset + j * 4] |
        (message[offset + j * 4 + 1] << 8) |
        (message[offset + j * 4 + 2] << 16) |
        (message[offset + j * 4 + 3] << 24);
    let A = a0,
      B = b0,
      C = c0,
      D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + k[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }
  const toHex = (n: number) => {
    let h = '';
    for (let i = 0; i < 4; i++) h += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    return h;
  };
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

/**
 * Parse every non-blank line into a key or an error. Lines are reported in
 * input order with their 1-based number, so the screen can point at the text.
 */
export async function parseSshKeys(text: string): Promise<SshKeyParseResult[]> {
  const results: SshKeyParseResult[] = [];
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = index + 1;
    const tokens = splitLine(lines[index].trim());
    if (tokens.length === 0) continue;

    const typeIndex = tokens.findIndex(isKeyTypeToken);
    if (typeIndex === -1) {
      results.push({ line, ok: false, error: 'No SSH key type found on this line' });
      continue;
    }
    const type = tokens[typeIndex];
    const blobToken = tokens[typeIndex + 1];
    if (!blobToken) {
      results.push({ line, ok: false, error: 'No base64 key data after the key type' });
      continue;
    }
    const bytes = base64ToBytes(blobToken);
    if (!bytes) {
      results.push({ line, ok: false, error: 'Key data is not valid base64' });
      continue;
    }

    // Certificate blobs keep a different layout and are never decoded; their
    // fingerprints still come from the blob bytes, so a strict inner-type check
    // would only turn valid certificates into errors.
    const isCertificate = type.endsWith(CERT_SUFFIX);
    const strings = readBlobStrings(bytes);
    if (!isCertificate) {
      if (!strings) {
        results.push({ line, ok: false, error: 'Key blob is malformed' });
        continue;
      }
      if (new TextDecoder().decode(strings[0]) !== type) {
        results.push({ line, ok: false, error: 'Key blob type does not match the line' });
        continue;
      }
    }

    const digest = await crypto.subtle.digest('SHA-256', bytes);
    results.push({
      line,
      ok: true,
      type,
      bits: deriveBits(type, strings),
      // OpenSSH writes SHA256 fingerprints as unpadded base64.
      fingerprintSha256: `SHA256:${bytesToBase64(new Uint8Array(digest)).replace(/=+$/, '')}`,
      fingerprintMd5: colonHex(md5Bytes(bytes)),
      comment: tokens.slice(typeIndex + 2).join(' '),
      options: tokens.slice(0, typeIndex).join(' '),
      isCertificate,
      isSecurityKey: type.startsWith('sk-') || type.startsWith('webauthn-'),
    });
  }
  return results;
}
