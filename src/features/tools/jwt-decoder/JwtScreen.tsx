import { useMemo } from 'react';
import {
  IconAlertTriangle,
  IconCircleCheckFilled,
  IconCopy,
  IconFlask,
  IconTrash,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

/** Unsigned test token: header {"alg":"HS256","typ":"JWT"}, payload with sub/name/iat. */
export const JWT_SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkFkYSIsImlhdCI6MTc5MDk0MjQwMH0.';

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  rawHeader: string;
  rawPayload: string;
  signature: string;
}

export function base64UrlDecode(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function parseJwtObject(raw: string): Record<string, unknown> {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('JWT part must decode to a JSON object');
  return value as Record<string, unknown>;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('A JWT must have three dot-separated parts');
  const rawHeader = base64UrlDecode(parts[0]);
  const rawPayload = base64UrlDecode(parts[1]);
  return {
    header: parseJwtObject(rawHeader),
    payload: parseJwtObject(rawPayload),
    rawHeader,
    rawPayload,
    signature: parts[2],
  };
}

const TIME_CLAIMS = ['exp', 'iat', 'nbf'];

export function formatUnixTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString();
}

export function claimAnnotation(
  key: string,
  value: unknown,
  nowMs: number = Date.now(),
): string | null {
  if (!TIME_CLAIMS.includes(key) || typeof value !== 'number') return null;
  const expired = key === 'exp' && value * 1000 < nowMs;
  return `${formatUnixTime(value)}${expired ? ' — expired' : ''}`;
}

export function isJwtExpired(
  payload: Record<string, unknown>,
  nowMs: number = Date.now(),
): boolean {
  const exp = payload['exp'];
  return typeof exp === 'number' && exp * 1000 < nowMs;
}

interface JwtOutcome {
  decoded: DecodedJwt | null;
  error: string;
}

export function JwtScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [pretty, setPretty] = useSessionDocumentState<boolean>('prettyClaims', true);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo<JwtOutcome>(() => {
    if (!input.trim()) return { decoded: null, error: '' };
    try {
      return { decoded: decodeJwt(input), error: '' };
    } catch (e) {
      return { decoded: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  const decoded = outcome.decoded;
  const claimsJson = decoded
    ? pretty
      ? JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2)
      : JSON.stringify({ header: decoded.header, payload: decoded.payload })
    : '';

  const copyClaims = async () => {
    if (!claimsJson) return;
    try {
      await navigator.clipboard.writeText(claimsJson);
      notify('Claims copied');
    } catch {
      notify('Clipboard unavailable. Select the claims and copy them.');
    }
  };

  const alg = decoded ? String(decoded.header['alg'] ?? 'none') : '';
  const iat = decoded?.payload['iat'];
  const exp = decoded?.payload['exp'];
  const expired = decoded ? isJwtExpired(decoded.payload) : false;

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>JWT</h1>
          <p>Decode and inspect JWT tokens</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconAlertTriangle size={18} />
            Decode only — signature not verified
          </span>
        </div>
      </div>

      <div className="wb-toolbar">
        <Button type="button" className="wb-button primary" onClick={() => setInput(JWT_SAMPLE)}>
          <IconFlask size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button type="button" variant="outline" className="wb-button" onClick={() => setInput('')}>
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
        <label>
          <Checkbox checked={pretty} onCheckedChange={(checked) => setPretty(Boolean(checked))} />
          Pretty-print claims
        </label>
      </div>

      {outcome.error && (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t decode this token.</strong>
          <span>{outcome.error}</span>
        </div>
      )}

      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Token panel">
          <div className="wb-pane-header">
            <h2>Token</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="JWT token"
            placeholder="Paste a JWT (xxxxx.yyyyy.zzzzz)…"
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>

        <section className="wb-editor-pane" aria-label="Claims panel">
          <div className="wb-pane-header">
            <h2>Claims</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!decoded}
                onClick={copyClaims}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy claims
              </Button>
            </div>
          </div>
          <CodeEditor
            value={claimsJson}
            readOnly
            wrap={wrap}
            label="Decoded claims"
            language="json"
            placeholder="Decoded claims appear here."
          />
          <div className="wb-pane-footer">
            <span>{decoded ? 'Valid structure' : 'Waiting for input'}</span>
          </div>
        </section>
      </div>

      {decoded && (
        <div>
          <div className="wb-setting-row">
            <span>
              <strong>Algorithm</strong>
              <small>Signing algorithm from the header</small>
            </span>
            <span>{alg}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Issued at</strong>
              <small>iat claim in human time</small>
            </span>
            <span>{typeof iat === 'number' ? formatUnixTime(iat) : 'Not present'}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Expires</strong>
              <small>exp claim in human time</small>
            </span>
            <span>
              {typeof exp === 'number' ? (claimAnnotation('exp', exp) ?? '') : 'Not present'}
            </span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Status</strong>
              <small>Decoding never verifies the signature</small>
            </span>
            <span className={expired ? undefined : 'wb-green'}>
              {typeof exp === 'number' ? (expired ? 'Expired' : 'Active') : 'No expiry set'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
