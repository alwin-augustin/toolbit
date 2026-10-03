import { useEffect, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconFlask,
  IconTrash,
} from '@tabler/icons-react';
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';

export type CertValidity = 'valid' | 'expired' | 'not_yet_valid';

export interface DecodedCertificate {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  publicKeySize: string;
  sans: string[];
  fingerprints: { sha1: string; sha256: string };
  validityStatus: CertValidity;
  extensions: { name: string; critical: boolean; value: string }[];
}

const OID_MAP: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
  '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
  '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
  '1.2.840.10045.2.1': 'EC',
  '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
  '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
  '2.5.29.17': 'Subject Alternative Name',
  '2.5.29.15': 'Key Usage',
  '2.5.29.37': 'Extended Key Usage',
  '2.5.29.19': 'Basic Constraints',
  '2.5.29.14': 'Subject Key Identifier',
  '2.5.29.35': 'Authority Key Identifier',
  '2.5.29.31': 'CRL Distribution Points',
  '1.3.6.1.5.5.7.1.1': 'Authority Information Access',
};

export function pemToArrayBuffer(pem: string): ArrayBuffer {
  const blocks: string[] = [];
  const pemBlockRegex = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;
  let match: RegExpExecArray | null;
  while ((match = pemBlockRegex.exec(pem)) !== null) {
    const label = match[1] || '';
    if (label.includes('CERTIFICATE')) {
      blocks.push(match[2] || '');
    }
  }

  const candidates = blocks.length > 0 ? blocks : [pem];

  for (const body of candidates) {
    const cleaned = body.replace(/[^A-Za-z0-9+/=]/g, '');
    if (!cleaned) continue;
    const padding = cleaned.length % 4 === 0 ? '' : '='.repeat(4 - (cleaned.length % 4));
    const b64 = `${cleaned}${padding}`;
    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch {
      // try next candidate
    }
  }

  throw new Error('Invalid PEM/base64 data. Ensure the certificate is complete.');
}

function rdnToObject(rdn: pkijs.RelativeDistinguishedNames): Record<string, string> {
  const result: Record<string, string> = {};
  for (const typeAndValue of rdn.typesAndValues) {
    const oid = typeAndValue.type;
    const name = OID_MAP[oid] || oid;
    result[name] = typeAndValue.value.valueBlock.value as string;
  }
  return result;
}

export function certBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}

async function computeFingerprint(data: ArrayBuffer, algo: string): Promise<string> {
  const hash = await crypto.subtle.digest(algo, data);
  return certBufferToHex(hash);
}

export async function decodeCertificate(
  pem: string,
  now: Date = new Date(),
): Promise<DecodedCertificate> {
  const der = pemToArrayBuffer(pem);
  const asn1 = asn1js.fromBER(der);
  if (asn1.offset === -1) throw new Error('Invalid ASN.1 data');

  const cert = new pkijs.Certificate({ schema: asn1.result });

  const subject = rdnToObject(cert.subject);
  const issuer = rdnToObject(cert.issuer);
  const serialNumber = Array.from(new Uint8Array(cert.serialNumber.valueBlock.valueHexView))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
  const notBefore = cert.notBefore.value;
  const notAfter = cert.notAfter.value;

  const signatureAlgorithm =
    OID_MAP[cert.signatureAlgorithm.algorithmId] || cert.signatureAlgorithm.algorithmId;
  const publicKeyAlgorithm =
    OID_MAP[cert.subjectPublicKeyInfo.algorithm.algorithmId] ||
    cert.subjectPublicKeyInfo.algorithm.algorithmId;

  let publicKeySize = 'Unknown';
  try {
    const pkRaw = cert.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView;
    publicKeySize = `${(pkRaw.byteLength - 1) * 8} bits`;
  } catch {
    // ignore
  }

  const sans: string[] = [];
  const extensions: { name: string; critical: boolean; value: string }[] = [];
  if (cert.extensions) {
    for (const ext of cert.extensions) {
      const name = OID_MAP[ext.extnID] || ext.extnID;
      if (ext.extnID === '2.5.29.17') {
        try {
          const sanExt = ext.parsedValue as unknown as {
            altNames?: { type: number; value: unknown }[];
            names?: { type: number; value: unknown }[];
          };
          const entries = sanExt?.altNames ?? sanExt?.names ?? [];
          for (const n of entries) {
            if (n.type === 2) sans.push(String(n.value));
            else if (n.type === 7) sans.push(`IP: ${String(n.value)}`);
          }
        } catch {
          // ignore
        }
      }
      extensions.push({
        name,
        critical: ext.critical,
        value: ext.extnID === '2.5.29.17' ? sans.join(', ') : name,
      });
    }
  }

  const [sha1, sha256] = await Promise.all([
    computeFingerprint(der, 'SHA-1'),
    computeFingerprint(der, 'SHA-256'),
  ]);

  const validityStatus: CertValidity =
    now < notBefore ? 'not_yet_valid' : now > notAfter ? 'expired' : 'valid';

  return {
    subject,
    issuer,
    serialNumber,
    notBefore: notBefore.toISOString(),
    notAfter: notAfter.toISOString(),
    signatureAlgorithm,
    publicKeyAlgorithm,
    publicKeySize,
    sans,
    fingerprints: { sha1, sha256 },
    validityStatus,
    extensions,
  };
}

export function formatCertDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function validityLabel(status: CertValidity): string {
  if (status === 'valid') return 'Valid';
  if (status === 'expired') return 'Expired';
  return 'Not yet valid';
}

export const CERT_SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIDYjCCAkqgAwIBAgIUc2tf8xDyCRUngVbSY3m/ZPBI5uYwDQYJKoZIhvcNAQEL
BQAwLDEUMBIGA1UEAwwLZXhhbXBsZS5jb20xFDASBgNVBAoMC0V4YW1wbGUgT3Jn
MB4XDTI2MTAwMjE1NTcxNFoXDTM2MDkyOTE1NTcxNFowLDEUMBIGA1UEAwwLZXhh
bXBsZS5jb20xFDASBgNVBAoMC0V4YW1wbGUgT3JnMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAtmvGEug5v95bbAg+XNQOfov5sHmFklSFwAg81re6ZlyC
lRhYjsniC+iJLfPbVEOooK9Aikxokg+HKhtOc+BSieB9qkGydaqVGmE5nGUnJujr
nfgJAEIF96egeVYZC0CiAjssdZI2vK+NNpqN4076jFJkl+iUfqhUC+8QAJJwKLSC
50j53H7oXGrYjiz1OynjPc4dCgKQWFZtNd4hIA3V/Abd7OQlYh3sZefux4ApPG2Z
ufyloVMgPhukfJ1Qp7OMvkz2QvUY1AXc0x+8gNmzlcpKJTH4JdSIYu9nASVbIXUS
387ldayRFwh80Zq+jBMlTHwnZz1BKGED5eeppzh2QQIDAQABo3wwejAdBgNVHQ4E
FgQUMMUntKTpuPjnt7oeg1pWkt61NrYwHwYDVR0jBBgwFoAUMMUntKTpuPjnt7oe
g1pWkt61NrYwDwYDVR0TAQH/BAUwAwEB/zAnBgNVHREEIDAeggtleGFtcGxlLmNv
bYIPd3d3LmV4YW1wbGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQAQG/Jzl/EkCfqT
l8/Y7numat75Nh6jE8wa9GyrvFzbGNJSVrB5umvfQcyADaQgQ85C9K3FlDdlx7b3
hZ0OffdSNK5eJiolSy9l0AfC/UIdkKcZNMRUXqvVJN/l7GD0n1PibYVeJlV2QmPL
Oyxmb847uRrG53qE8wNgt7E67aqWIsKZp8W8Lbl6DRoZPolpz53Bwon5jMqKXSUn
EsbNQDmjCKouwangeJ24J6CAwo2nYBbWZcdE0QL82sUG8t6WGiZggbZI05WCFsFd
EbZfkX8sTXQ15afh9vu5xDnKniHQD71UBD5ga/n0WME/GS0idBNMpRPeiPhYTUJ7
BQu7q9S+
-----END CERTIFICATE-----`;

export function CertScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [certInfo, setCertInfo] = useSessionDocumentState<DecodedCertificate | null>(
    'certInfo',
    null,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  useEffect(() => {
    if (!input.trim()) {
      setCertInfo(null);
      setError('');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      decodeCertificate(input)
        .then((info) => {
          if (cancelled) return;
          setCertInfo(info);
          setError('');
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : 'Failed to decode certificate');
          setCertInfo(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, setCertInfo]);

  const copyDetails = async () => {
    if (!certInfo) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(certInfo, null, 2));
      notify('Certificate details copied');
    } catch {
      notify('Clipboard unavailable. Select the details and copy them.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Certificate</h1>
          <p>Inspect X.509 certificates</p>
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
          onClick={() => setInput(CERT_SAMPLE_PEM)}
        >
          <IconFlask size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!input}
          onClick={() => setInput('')}
        >
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!certInfo}
          onClick={() => void copyDetails()}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy details
        </Button>
        {loading ? <span>Decoding…</span> : null}
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t decode this certificate.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="PEM panel">
          <div className="wb-pane-header">
            <h2>PEM certificate</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="PEM certificate"
            placeholder={'-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----'}
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Details panel">
          <div className="wb-pane-header">
            <h2>Certificate details</h2>
          </div>
          {certInfo ? (
            <div>
              <div className="wb-setting-row">
                <span>
                  <strong>Status</strong>
                  <small>Validity at current time</small>
                </span>
                <span className={certInfo.validityStatus === 'valid' ? 'wb-green' : undefined}>
                  {validityLabel(certInfo.validityStatus)}
                </span>
              </div>
              {Object.entries(certInfo.subject).map(([key, value]) => (
                <div className="wb-setting-row" key={`subject-${key}`}>
                  <span>
                    <strong>Subject {key}</strong>
                    <small data-testid={`subject-${key}`}>{value}</small>
                  </span>
                </div>
              ))}
              {Object.entries(certInfo.issuer).map(([key, value]) => (
                <div className="wb-setting-row" key={`issuer-${key}`}>
                  <span>
                    <strong>Issuer {key}</strong>
                    <small>{value}</small>
                  </span>
                </div>
              ))}
              <div className="wb-setting-row">
                <span>
                  <strong>Not before</strong>
                  <small>{formatCertDate(certInfo.notBefore)}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>Not after</strong>
                  <small>{formatCertDate(certInfo.notAfter)}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>Serial number</strong>
                  <small>{certInfo.serialNumber}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>Signature</strong>
                  <small>{certInfo.signatureAlgorithm}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>Public key</strong>
                  <small>
                    {certInfo.publicKeyAlgorithm} ({certInfo.publicKeySize})
                  </small>
                </span>
              </div>
              {certInfo.sans.length > 0 ? (
                <div className="wb-setting-row">
                  <span>
                    <strong>Subject alternative names</strong>
                    <small>{certInfo.sans.join(', ')}</small>
                  </span>
                </div>
              ) : null}
              <div className="wb-setting-row">
                <span>
                  <strong>SHA-1 fingerprint</strong>
                  <small>{certInfo.fingerprints.sha1}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>SHA-256 fingerprint</strong>
                  <small>{certInfo.fingerprints.sha256}</small>
                </span>
              </div>
            </div>
          ) : (
            <div className="wb-empty">
              <h2>No certificate yet</h2>
              <p>Paste a PEM certificate to decode subject, issuer, validity, and fingerprints.</p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>{certInfo ? validityLabel(certInfo.validityStatus) : 'Waiting for input'}</span>
          </div>
        </section>
      </div>
    </>
  );
}
