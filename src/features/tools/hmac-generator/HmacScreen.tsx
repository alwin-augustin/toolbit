import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export interface HmacSignature {
  hex: string;
  base64: string;
}

export type HmacAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export type HmacOutputFormat = 'hex' | 'base64';

/** Webhook body and signing secret, so the tool opens with something to sign. */
export const HMAC_SAMPLE_MESSAGE =
  '{"event":"invoice.paid","invoice":{"id":"inv_1042","amount":24900}}';
export const HMAC_SAMPLE_KEY = 'whsec_2f8b1c9d4e6a7f3b';

const ALGORITHMS: HmacAlgorithm[] = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512'];

const OUTPUT_FORMATS: { value: HmacOutputFormat; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
];

const SUPPORTED_ALGORITHMS = new Set<string>(ALGORITHMS);

/**
 * Sign `message` with `key` using WebCrypto. Both encodings come back from one
 * signature: the pane shows whichever the user picked, and the verify box can
 * compare against whichever the sender published.
 */
export async function computeHmac(
  message: string,
  key: string,
  algorithm: string,
): Promise<{ ok: true; hex: string; base64: string } | { ok: false }> {
  if (!SUPPORTED_ALGORITHMS.has(algorithm)) return { ok: false };
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    const bytes = new Uint8Array(signature);
    let hex = '';
    let binary = '';
    for (const byte of bytes) {
      hex += byte.toString(16).padStart(2, '0');
      binary += String.fromCharCode(byte);
    }
    return { ok: true, hex, base64: btoa(binary) };
  } catch {
    // With a known algorithm the remaining failure mode is the environment
    // refusing to sign, which the caller reports as the same plain failure.
    return { ok: false };
  }
}

/**
 * Compare a pasted signature with the computed pair. Hex wins whenever the
 * input could be either, because digests get pasted upper-case and
 * colon-separated from other tools; base64 is case-sensitive and stays exact.
 */
export function signatureMatches(
  expected: string,
  actual: { hex: string; base64: string },
): boolean {
  const compact = expected.replace(/\s+/g, '');
  const hexCandidate = compact.replace(/:/g, '');
  if (/^[0-9a-f]+$/i.test(hexCandidate) && hexCandidate.length % 2 === 0) {
    return hexCandidate.toLowerCase() === actual.hex.toLowerCase();
  }
  return compact === actual.base64;
}

export function HmacScreen() {
  const [message, setMessage] = useDocumentField<string>('input', '');
  const [secretKey, setSecretKey] = useDocumentField<string>('secretKey', '');
  const [algorithm, setAlgorithm] = useSessionDocumentState<HmacAlgorithm>(
    'hmacAlgorithm',
    'SHA-256',
  );
  const [format, setFormat] = useSessionDocumentState<HmacOutputFormat>('hmacFormat', 'hex');
  const [signature, setSignature] = useSessionDocumentState<HmacSignature | null>(
    'signature',
    null,
  );
  const [expected, setExpected] = useDocumentField<string>('expectedSignature', '');
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);
  /** Monotonic token so only the newest sign call may write its result. */
  const signRequest = useRef(0);

  const runCompute = useCallback(async () => {
    const request = ++signRequest.current;
    if (!message.trim() || !secretKey) {
      setSignature(null);
      setError('');
      setIsComputing(false);
      return;
    }
    setIsComputing(true);
    const result = await computeHmac(message, secretKey, algorithm);
    if (request !== signRequest.current) return;
    if (result.ok) {
      setSignature({ hex: result.hex, base64: result.base64 });
      setError('');
    } else {
      setSignature(null);
      setError('No signature could be computed with this algorithm.');
    }
    setIsComputing(false);
  }, [message, secretKey, algorithm, setSignature]);

  // Live compute: re-sign on every input change, with no debounce, because
  // subtle.sign is async by design — unlike HashScreen's synchronous MD5.
  useEffect(() => {
    void runCompute();
  }, [runCompute]);

  const output = signature ? (format === 'hex' ? signature.hex : signature.base64) : '';
  // The signature is what "Save Result…" writes for this tool.
  usePublishedResult(output, 'Signature', 'txt');

  const matches = signature !== null && signatureMatches(expected, signature);
  const hasVerdict = expected.trim().length > 0 && signature !== null;

  const loadSample = () => {
    setMessage(HMAC_SAMPLE_MESSAGE);
    setSecretKey(HMAC_SAMPLE_KEY);
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      notify('Signature copied');
    } catch {
      notify('Clipboard unavailable. Select the signature and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>HMAC Generator</h1>
          <p>Compute and verify HMAC signatures</p>
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
        <Button type="button" variant="outline" className="wb-button" onClick={loadSample}>
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => {
            setMessage('');
            setSecretKey('');
          }}
          disabled={!message && !secretKey}
        >
          Clear
        </Button>
        <Label className="wb-toolbar-label">
          Algorithm:
          <NativeSelect
            size="sm"
            aria-label="Algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as HmacAlgorithm)}
          >
            {ALGORITHMS.map((name) => (
              <NativeSelectOption key={name} value={name}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Label className="wb-toolbar-label">
          Output format:
          <NativeSelect
            size="sm"
            aria-label="Output format"
            value={format}
            onChange={(e) => setFormat(e.target.value as HmacOutputFormat)}
          >
            {OUTPUT_FORMATS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        {/* The manual path calls the same function the live effect does, so the
            two cannot drift apart. */}
        <Button
          type="button"
          className="wb-button primary"
          disabled={isComputing || !message.trim() || !secretKey}
          onClick={() => void runCompute()}
        >
          Compute
        </Button>
      </div>
      <p className="wb-note">
        A match proves the message matches the key you entered, not who sent it. Everything is
        computed locally.
      </p>
      <div className="wb-setting-row">
        <span>
          <strong>Secret key</strong>
          <small>Shared secret used as the HMAC key</small>
        </span>
        <Input
          aria-label="Secret key"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="whsec_…"
        />
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Message panel">
          <div className="wb-pane-header">
            <h2>Message</h2>
          </div>
          <CodeEditor
            value={message}
            onChange={setMessage}
            wrap={wrap}
            label="Message"
            placeholder="Paste the message the sender signed..."
          />
          <div className="wb-pane-footer">
            <span>{message.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Signature panel">
          <div className="wb-pane-header">
            <h2>Signature</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!output}
                onClick={() => void copyOutput()}
              >
                <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                Copy
              </Button>
            </div>
          </div>
          <CodeEditor
            value={output}
            readOnly
            wrap={wrap}
            label="Signature"
            placeholder="The HMAC signature appears here."
          />
          <div className="wb-pane-footer">
            <span>
              {isComputing
                ? 'Computing…'
                : output
                  ? `${algorithm} · ${format === 'hex' ? 'Hex' : 'Base64'}`
                  : 'Waiting for input'}
            </span>
          </div>
        </section>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Expected signature</strong>
          <small>Hex or base64; hex may be upper-case and colon-separated</small>
        </span>
        <Input
          aria-label="Expected signature"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Paste a signature to compare"
        />
      </div>
      {hasVerdict ? (
        <div className="wb-setting-row">
          <span>
            <strong>Verification</strong>
            <small>
              {matches
                ? 'The expected signature matches this message and key.'
                : 'The expected signature does not match this message and key.'}
            </small>
          </span>
          <div
            role="status"
            className={
              matches
                ? 'flex items-center gap-1.5 wb-green'
                : 'flex items-center gap-1.5 text-danger'
            }
          >
            {matches ? (
              <IconCircleCheckFilled size={16} aria-hidden="true" />
            ) : (
              <IconAlertTriangle size={16} aria-hidden="true" />
            )}
            {matches ? 'Match' : 'No match'}
          </div>
        </div>
      ) : null}
    </>
  );
}
