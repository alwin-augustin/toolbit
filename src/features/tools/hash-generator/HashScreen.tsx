import { useEffect, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';

export interface HashResult {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

export const HASH_SAMPLE = 'Hello, World!';

export const HASH_LABELS: { key: keyof HashResult; label: string }[] = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA-1' },
  { key: 'sha256', label: 'SHA-256' },
  { key: 'sha512', label: 'SHA-512' },
];

const EMPTY_HASHES: HashResult = { md5: '', sha1: '', sha256: '', sha512: '' };

// Inline MD5 for small inputs (main thread). Copied from the legacy HashGenerator.
export function md5(input: string): string {
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
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0xd800 || code >= 0xe000)
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else {
      const cp = 0x10000 + (((code & 0x3ff) << 10) | (input.charCodeAt(++i) & 0x3ff));
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push(Math.floor(bitLen / 2 ** (i * 8)) & 0xff);
  let a0 = 0x67452301 >>> 0,
    b0 = 0xefcdab89 >>> 0,
    c0 = 0x98badcfe >>> 0,
    d0 = 0x10325476 >>> 0;
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++)
      M[j] =
        bytes[offset + j * 4] |
        (bytes[offset + j * 4 + 1] << 8) |
        (bytes[offset + j * 4 + 2] << 16) |
        (bytes[offset + j * 4 + 3] << 24);
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

export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < byteArray.length; i++) hex += byteArray[i].toString(16).padStart(2, '0');
  return hex;
}

export async function computeDigests(text: string): Promise<HashResult> {
  if (text.length > 2_000_000) throw new Error('Input too large (max 2M characters).');
  const data = new TextEncoder().encode(text);
  const [sha1, sha256, sha512] = await Promise.all([
    crypto.subtle.digest('SHA-1', data),
    crypto.subtle.digest('SHA-256', data),
    crypto.subtle.digest('SHA-512', data),
  ]);
  return {
    md5: md5(text),
    sha1: arrayBufferToHex(sha1),
    sha256: arrayBufferToHex(sha256),
    sha512: arrayBufferToHex(sha512),
  };
}

export function HashScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [hashes, setHashes] = useSessionDocumentState<HashResult>('hashes', EMPTY_HASHES);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  useEffect(() => {
    if (!input.trim()) {
      setHashes(EMPTY_HASHES);
      setError('');
      return;
    }
    if (input.length > 2_000_000) {
      setHashes(EMPTY_HASHES);
      setError('Input too large (max 2M characters). Trim the input to compute digests.');
      setIsComputing(false);
      return;
    }
    let cancelled = false;
    setIsComputing(true);
    const timer = window.setTimeout(() => {
      computeDigests(input)
        .then((result) => {
          if (cancelled) return;
          setHashes(result);
          setError('');
        })
        .catch(() => {
          if (cancelled) return;
          setError('Error generating hashes');
        })
        .finally(() => {
          if (!cancelled) setIsComputing(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, setHashes]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  const hasOutput = HASH_LABELS.some(({ key }) => hashes[key]);
  const allHashes = HASH_LABELS.map(({ label, key }) => `${label}: ${hashes[key]}`).join('\n');

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Hashes</h1>
          <p>Compute MD5 and SHA digests</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <Button type="button" className="wb-button primary" onClick={() => setInput(HASH_SAMPLE)}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setInput('')}
          disabled={!input}
        >
          Clear
        </Button>
        {isComputing ? <span>Computing…</span> : null}
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Input panel">
          <div className="wb-pane-header">
            <h2>Input</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Input text"
            placeholder="Enter text to hash..."
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Digests panel">
          <div className="wb-pane-header">
            <h2>Digests</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!hasOutput}
                onClick={() => void copyText(allHashes, 'All digests')}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy all
              </Button>
            </div>
          </div>
          {hasOutput ? (
            <div>
              {HASH_LABELS.map(({ key, label }) => (
                <div key={key} className="wb-setting-row">
                  <span>
                    <strong>{label}</strong>
                    <small data-testid={`output-${key}`}>{hashes[key]}</small>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="wb-icon-button"
                    aria-label={`Copy ${label}`}
                    onClick={() => void copyText(hashes[key], label)}
                  >
                    <IconCopy size={20} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="wb-empty">
              <h2>No digests yet</h2>
              <p>MD5, SHA-1, SHA-256, and SHA-512 are computed locally as you type.</p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>{hasOutput ? '4 digests' : 'Waiting for input'}</span>
          </div>
        </section>
      </div>
    </>
  );
}
