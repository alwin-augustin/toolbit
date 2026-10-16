import { useEffect, useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconEraser,
  IconKey,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField } from '@/shared/document-state';
import { usePublishedResult } from '@/shared/result-store';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';
import { parseSshKeys, type SshKeyParseResult, type SshKeyParsed } from './ssh-key';

/** A real ed25519 public key, so the sample's fingerprints match ssh-keygen -l. */
export const SSH_KEY_SAMPLE =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL8oc+Q5FlCvwXDCx1F78tVv6Ztt9jeVQT81YyDgGgG7 ada@example.com';

/** Plain-text report: one labelled block per key. */
function formatReport(keys: SshKeyParsed[]): string {
  return keys
    .map((key) =>
      [
        `Type: ${key.type}`,
        `Bits: ${key.bits === null ? 'Not derived' : `${key.bits} bits`}`,
        `SHA256: ${key.fingerprintSha256}`,
        `MD5: ${key.fingerprintMd5}`,
        `Comment: ${key.comment || '(none)'}`,
      ].join('\n'),
    )
    .join('\n\n');
}

export function SshKeyScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [results, setResults] = useState<SshKeyParseResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  // A private key is never parsed: its base64 body is not a public key blob, and
  // the warning must not be masked by a wall of line errors.
  const hasPrivateKey = input.includes('-----BEGIN');

  useEffect(() => {
    if (!input.trim() || hasPrivateKey) {
      setResults([]);
      setError('');
      setIsParsing(false);
      return;
    }
    let cancelled = false;
    setIsParsing(true);
    const timer = window.setTimeout(() => {
      parseSshKeys(input)
        .then((parsed) => {
          if (cancelled) return;
          setResults(parsed);
          setError('');
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : 'Could not parse this input');
          setResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsParsing(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, hasPrivateKey]);

  const keys = results.filter((result): result is SshKeyParsed => result.ok);
  const report = formatReport(keys);
  // Blank lines are the only lines the parser deliberately passes over.
  const skippedLines = useMemo(
    () => input.split('\n').filter((line) => !line.trim()).length,
    [input],
  );

  usePublishedResult(report, 'SSH key report', 'txt');

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      notify('Key report copied');
    } catch {
      notify('Clipboard unavailable. Select the results and copy them.');
    }
  };

  const copyFingerprint = async (key: SshKeyParsed) => {
    try {
      await navigator.clipboard.writeText(key.fingerprintSha256);
      notify(`SHA256 fingerprint for line ${key.line} copied`);
    } catch {
      notify('Clipboard unavailable. Select the fingerprint and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>SSH Key Inspector</h1>
          <p>Parse SSH public keys and fingerprints</p>
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
        <Button
          type="button"
          className="wb-button primary"
          onClick={() => setInput(SSH_KEY_SAMPLE)}
        >
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setInput('')}
          disabled={!input}
        >
          <IconEraser size={16} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
        {isParsing ? <span>Parsing…</span> : null}
      </div>
      {hasPrivateKey ? (
        <div className="wb-warning-banner" role="alert">
          <span className="flex items-center gap-1.5">
            <IconAlertTriangle size={16} stroke={1.7} aria-hidden="true" />
            <strong>Private key detected — never paste private keys into browser tools.</strong>
          </span>
          <span>
            Nothing was sent anywhere: this tool runs in the tab and does not parse the key. If it
            was ever pasted somewhere untrusted, rotate it now.
          </span>
        </div>
      ) : null}
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Public keys panel">
          <div className="wb-pane-header">
            <h2>Public keys</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Public keys"
            placeholder={'ssh-ed25519 AAAA… user@host — one key per line'}
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Results panel">
          <div className="wb-pane-header">
            <h2>Keys</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!report}
                onClick={() => void copyReport()}
              >
                <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                Copy all
              </Button>
            </div>
          </div>
          {results.length > 0 ? (
            <div className="wb-pane-body">
              <div className="flex flex-col gap-2 p-2">
                {results.map((result) =>
                  result.ok ? (
                    <div className="wb-card" key={`key-${result.line}`}>
                      <div className="wb-card-head">
                        <IconKey size={16} stroke={1.7} aria-hidden="true" />
                        <strong className="font-mono break-all">{result.type}</strong>
                        <small>line {result.line}</small>
                        {result.isCertificate ? <small>certificate</small> : null}
                        {result.isSecurityKey ? <small>security key</small> : null}
                        <span className="wb-row-action">
                          <Button
                            type="button"
                            variant="outline"
                            aria-label={`Copy SHA256 fingerprint for the key on line ${result.line}`}
                            onClick={() => void copyFingerprint(result)}
                          >
                            <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                            Copy
                          </Button>
                        </span>
                      </div>
                      <div className="wb-setting-row">
                        <span>
                          <strong>Key size</strong>
                          <small>
                            {result.bits === null ? 'Not derived' : `${result.bits} bits`}
                          </small>
                        </span>
                      </div>
                      <div className="wb-setting-row">
                        <span>
                          <strong>SHA256 fingerprint</strong>
                          <small className="font-mono break-all">{result.fingerprintSha256}</small>
                        </span>
                      </div>
                      <div className="wb-setting-row">
                        <span>
                          <strong>MD5 fingerprint</strong>
                          <small className="font-mono break-all">{result.fingerprintMd5}</small>
                        </span>
                      </div>
                      <div className="wb-setting-row">
                        <span>
                          <strong>Comment</strong>
                          <small>{result.comment || '(none)'}</small>
                        </span>
                      </div>
                      {result.options ? (
                        <div className="wb-setting-row">
                          <span>
                            <strong>Authorized keys options</strong>
                            <small className="font-mono break-all">{result.options}</small>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="wb-card" key={`error-${result.line}`}>
                      <div className="wb-list-row text-danger">
                        <IconAlertTriangle size={16} stroke={1.7} aria-hidden="true" />
                        <span>
                          <strong>Line {result.line}</strong>
                          <small>{result.error}</small>
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="wb-empty">
              <h2>{hasPrivateKey ? 'Private key not parsed' : 'No keys yet'}</h2>
              <p>
                {hasPrivateKey
                  ? 'Remove the private key and paste its .pub line instead.'
                  : 'Paste one public key per line. Type, size, and fingerprints appear as you type.'}
              </p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>
              {keys.length} keys parsed · {skippedLines} lines skipped
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
