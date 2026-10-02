import { useDocumentField, useDocumentOptions } from '../document-state';
import { useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Button, Badge, Checkbox } from '@/ds/components';
import { CodeEditor } from '../CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '../EditorPanels';
import { registerInspectorPanel } from '../Inspector';
import { useEditorStatus } from '../workspace-store';
import { useSmartPasteInput } from '../smart-paste';
import { useToolHistory } from '@/hooks/use-tool-history';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.lBTQmKFHnpGmOe2PObMRCG9GMAKpSChav4woD3Y9YeA';

function useJwtOptions() {
  return useDocumentOptions({ expandClaims: true as boolean, showRaw: false as boolean });
}

function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  rawHeader: string;
  rawPayload: string;
  signature: string;
}

function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('A JWT must have three dot-separated parts');
  const rawHeader = base64UrlDecode(parts[0]);
  const rawPayload = base64UrlDecode(parts[1]);
  return {
    header: JSON.parse(rawHeader),
    payload: JSON.parse(rawPayload),
    rawHeader,
    rawPayload,
    signature: parts[2],
  };
}

const TIME_CLAIMS = ['exp', 'iat', 'nbf'];

function claimAnnotation(key: string, value: unknown): string | null {
  if (!TIME_CLAIMS.includes(key) || typeof value !== 'number') return null;
  const d = new Date(value * 1000);
  const expired = key === 'exp' && value * 1000 < Date.now();
  return `${d.toLocaleString()}${expired ? ' — expired' : ''}`;
}

function JwtInspectorPanel() {
  const { expandClaims, showRaw, set } = useJwtOptions();
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Checkbox
        checked={expandClaims}
        onChange={(v) => set({ expandClaims: v })}
        label="Expand all claims"
      />
      <Checkbox
        checked={showRaw}
        onChange={(v) => set({ showRaw: v })}
        label="Show raw header/payload"
      />
    </div>
  );
}

registerInspectorPanel('jwt-decoder', JwtInspectorPanel);

const semibold = 'var(--weight-semibold)' as CSSProperties['fontWeight'];

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        padding: '10px 12px 4px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        color: 'hsl(var(--text-faint))',
      }}
    >
      {children}
    </div>
  );
}

function ClaimsTable({ claims, expanded }: { claims: Record<string, unknown>; expanded: boolean }) {
  const entries = Object.entries(claims);
  const shown = expanded ? entries : entries.slice(0, 5);
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', padding: '0 12px' }}>
      {shown.map(([k, v]) => {
        const note = claimAnnotation(k, v);
        return (
          <div
            key={k}
            style={{ display: 'flex', gap: 10, padding: '3px 0', alignItems: 'baseline' }}
          >
            <span style={{ color: 'hsl(var(--code-key))', fontWeight: semibold, minWidth: 70 }}>
              {k}
            </span>
            <span style={{ color: 'hsl(var(--text-body))', wordBreak: 'break-all' }}>
              {typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}
            </span>
            {note && (
              <span
                style={{
                  color: 'hsl(var(--text-faint))',
                  fontSize: 'var(--text-xs)',
                  whiteSpace: 'nowrap',
                }}
              >
                {note}
              </span>
            )}
          </div>
        );
      })}
      {!expanded && entries.length > shown.length && (
        <div
          style={{ color: 'hsl(var(--text-faint))', fontSize: 'var(--text-xs)', padding: '3px 0' }}
        >
          +{entries.length - shown.length} more claims — enable “Expand all claims”
        </div>
      )}
    </div>
  );
}

export default function JwtDecoderV2() {
  const [input, setInput] = useDocumentField<string>('input', '');
  useSmartPasteInput(setInput);
  const { expandClaims, showRaw } = useJwtOptions();
  const setStatus = useEditorStatus((s) => s.setStatus);
  const { addEntry } = useToolHistory('jwt-decoder', 'JWT Decoder');

  const result = useMemo(() => {
    if (!input.trim())
      return { decoded: null as DecodedJwt | null, error: '', valid: null as boolean | null };
    try {
      return { decoded: decodeJwt(input), error: '', valid: true as boolean | null };
    } catch (e) {
      return {
        decoded: null,
        error: e instanceof Error ? e.message : String(e),
        valid: false as boolean | null,
      };
    }
  }, [input]);

  useEffect(() => {
    setStatus({
      valid: result.valid,
      validityLabel: result.valid === null ? '' : result.valid ? 'Valid JWT' : 'Invalid JWT',
    });
  }, [result.valid, setStatus]);

  useEffect(() => {
    if (result.valid !== true || !result.decoded) return;
    const t = setTimeout(
      () => addEntry({ input, output: JSON.stringify(result.decoded?.payload, null, 2) }),
      1500,
    );
    return () => clearTimeout(t);
  }, [input, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyText = result.decoded
    ? JSON.stringify({ header: result.decoded.header, payload: result.decoded.payload }, null, 2)
    : '';

  return (
    <EditorSplit toolId="jwt-decoder" output={copyText}>
      <Panel>
        <PanelHeader
          title="Token"
          badge={input.trim() ? <Badge tone="primary">detected JWT</Badge> : undefined}
          action={
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_JWT)}>
              Load sample
            </Button>
          }
        />
        <CodeEditor
          value={input}
          onChange={setInput}
          reportStatus
          showLineNumbers={false}
          placeholder="Paste a JWT (xxxxx.yyyyy.zzzzz)…"
        />
      </Panel>
      <Panel>
        <PanelHeader
          title="Decoded"
          badge={
            <ValidityBadge valid={result.valid} validLabel="valid JWT" invalidLabel="invalid" />
          }
          action={<CopyAction text={copyText} />}
        />
        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 10 }}>
          {result.valid === false && (
            <div
              style={{
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'hsl(var(--danger))',
              }}
            >
              {result.error}
            </div>
          )}
          {result.decoded && (
            <>
              <SectionLabel>Header</SectionLabel>
              {showRaw ? (
                <pre
                  style={{
                    margin: 0,
                    padding: '0 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'hsl(var(--text-body))',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {result.decoded.rawHeader}
                </pre>
              ) : (
                <ClaimsTable claims={result.decoded.header} expanded={expandClaims} />
              )}
              <SectionLabel>Payload</SectionLabel>
              {showRaw ? (
                <pre
                  style={{
                    margin: 0,
                    padding: '0 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'hsl(var(--text-body))',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {result.decoded.rawPayload}
                </pre>
              ) : (
                <ClaimsTable claims={result.decoded.payload} expanded={expandClaims} />
              )}
              <SectionLabel>Signature</SectionLabel>
              <div
                style={{
                  padding: '0 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'hsl(var(--text-muted))',
                  wordBreak: 'break-all',
                }}
              >
                {result.decoded.signature}
              </div>
            </>
          )}
        </div>
      </Panel>
    </EditorSplit>
  );
}
