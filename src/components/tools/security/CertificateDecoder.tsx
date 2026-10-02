import { useSessionDocumentState } from '@/v2/document-state';
import { useDocumentField } from '@/v2/document-state';
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button, Badge } from '@/ds/components';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { CodeEditor } from '@/v2/CodeEditor';
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from '@/v2/EditorPanels';
import { useEditorStatus } from '@/v2/workspace-store';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

interface CertInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  publicKeySize: string;
  sans: string[];
  fingerprints: { sha1: string; sha256: string };
  isValid: boolean;
  validityStatus: 'valid' | 'expired' | 'not_yet_valid';
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

function pemToArrayBuffer(pem: string): ArrayBuffer {
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

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}

async function computeFingerprint(data: ArrayBuffer, algo: string): Promise<string> {
  const hash = await crypto.subtle.digest(algo, data);
  return arrayBufferToHex(hash);
}

async function decodeCertificate(pem: string): Promise<CertInfo> {
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
  const now = new Date();

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

  // SANs
  const sans: string[] = [];
  const extensions: { name: string; critical: boolean; value: string }[] = [];
  if (cert.extensions) {
    for (const ext of cert.extensions) {
      const name = OID_MAP[ext.extnID] || ext.extnID;
      if (ext.extnID === '2.5.29.17') {
        // Subject Alternative Name
        try {
          const sanExt = ext.parsedValue as pkijs.GeneralNames;
          if (sanExt && sanExt.names) {
            for (const n of sanExt.names) {
              if (n.type === 2)
                sans.push(n.value as string); // DNS
              else if (n.type === 7) sans.push(`IP: ${n.value}`); // IP
            }
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

  const validityStatus = now < notBefore ? 'not_yet_valid' : now > notAfter ? 'expired' : 'valid';

  return {
    subject,
    issuer,
    serialNumber,
    notBefore,
    notAfter,
    signatureAlgorithm,
    publicKeyAlgorithm,
    publicKeySize,
    sans,
    fingerprints: { sha1, sha256 },
    isValid: validityStatus === 'valid',
    validityStatus,
    extensions,
  };
}

const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA0MoHEoVOxJfFJW5HlKkEyj4MA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNDA3MDEwMDAwMDBaFw0yNDA5MjkwMDAwMDBaMBkxFzAVBgNVBAMT
DmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0OaR
VqPRcOEYvqPdH6phH+4qlr8v7iFQ9uNrD+QLe2tCDu2dI3+AwGJo7a2G3R9e9AK
q9PBB1dnS3uFJvG7UdJEOR12m7K0kkBZ/NBFSy/wfJSibzxaB1vI0qjL9PjOG+Tr
dOAhONaVDggR78x6Iz3vIOjLCfWIGq3TqREB8G1nCVRB1c9GQUfTzR3T9Imhj6ZN
5IFJzXO22M/BV9U5wGI+F4LrVGqz5bp4X0BEH7F9/oa9jJ9QLmbSMm0Z7r2rzhY
+8KLQlgy1enWDl5SQH2Ony6l3FN1WiN+QlO3T6+zIFIu7WUEY+BoS3LDBA4+tIY
Vt3r2iW6G25TWaNm5wIDAQABo4ICfzCCAnswDgYDVR0PAQH/BAQDAgWgMB0GA1Ud
JQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQW
BBR+f8JAVxUFH/2W8QmUTRqBHiOUPTAfBgNVHSMEGDAWgBQULrMXt1hWy65QCUDm
H6+dixTCxjBVBggrBgEFBQcBAQRJMEcwIQYIKwYBBQUHMAGGFWh0dHA6Ly9yMy5v
LmxlbmNyLm9yZzAiBggrBgEFBQcwAoYWaHR0cDovL3IzLmkubGVuY3Iub3JnLzAZ
BgNVHREEEjAQgg5leGFtcGxlLmNvbTATBgNVHSAEDDAKMAgGBmeBDAECATCCAQQG
CisGAQQB1nkCBAIEgfUEgfIA8AB2AHb/iD8KtvuVUcJhzPWHujS0pM27KdxoQgqf
5mdMWjp0AAABkGtpNYgAAAQDAEcwRQIgUy7HyJTPNBUwDyQJMMK7e4IxQN33rkK0
xrz5eSKvV6cCIQCYV0c5RfRn7P7XJ0GaVFMa/m0GxOMoR/SfLq5YhJJLOgB2AO7N
0GTV2xrOxVy3nbTNE6Iyh0Z8vOzew1FIWUZxH7WbAAABkGtpNVcAAAQDAEcwRQIh
ALoSpM/qE3gV8fN6M1c2cW0Rmi4pWNO7sX7XG9ckZ0fDAiA9DpeBZHO7NHHfF/QP
aCbOVj/3HDOFzFR80L2dDQ/9cjANBgkqhkiG9w0BAQsFAAOCAQEAQGBfU/z2Qqwk
MlBvwl0JJKFkmGKL+jmWwX8SqrgH5DYNzjEA6P8k8g7KqLvMuX4jVeMF2gJRBvKu
S4yW/jS5L7AwIkqEb+6KxGBpb80SN8GM8u4+l7YL/IW0k7R/bBh+dyrAGJhJEbfS
oRK3hHPFH8y1kJByz6zDaRPa80yj/YKjBPg7MWWSE7I1P8lMPhOAj/Jhz1+n3k1c
N1T+GVAAfrLrMC0MPN0fQ3gJi7K+8D4a8SYXJkL0RoTIjhQ3NXQD7VKMDN+c+oR+
qJ5VMlFdKJl1vj9FPr+j1aHR+KCf9FYPcPeBaJkRZ1WM8lxV3bOJ7BFYL6dO0u/a
4z/2bTKDRw==
-----END CERTIFICATE-----`;

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        padding: '12px 0 4px',
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

function InfoRow({ label, value, small }: { label: string; value: ReactNode; small?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '4px 0',
        borderBottom: '1px solid hsl(var(--border-faint))',
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'hsl(var(--text-muted))',
          width: 110,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: small ? 'var(--text-xs)' : 'var(--text-sm)',
          color: 'hsl(var(--text-body))',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const statusBadgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4 };

function StatusBadge({ status }: { status: CertInfo['validityStatus'] }) {
  switch (status) {
    case 'valid':
      return (
        <Badge tone="success">
          <span style={statusBadgeStyle}>
            <CheckCircle size={12} /> Valid
          </span>
        </Badge>
      );
    case 'expired':
      return (
        <Badge tone="danger">
          <span style={statusBadgeStyle}>
            <AlertCircle size={12} /> Expired
          </span>
        </Badge>
      );
    case 'not_yet_valid':
      return (
        <Badge tone="warning">
          <span style={statusBadgeStyle}>
            <Clock size={12} /> Not yet valid
          </span>
        </Badge>
      );
  }
}

const formatDate = (d: Date) =>
  d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function CertificateDecoder() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [certInfo, setCertInfo] = useSessionDocumentState<CertInfo | null>('certInfo', null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setStatus = useEditorStatus((s) => s.setStatus);
  useUrlState(input, setInput);
  const { addEntry } = useToolHistory('certificate-decoder', 'Certificate Decoder');

  useEffect(() => {
    if (!input.trim()) {
      setCertInfo(null);
      setError('');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      decodeCertificate(input)
        .then((info) => {
          if (cancelled) return;
          setCertInfo(info);
          setError('');
          addEntry({ input, output: JSON.stringify(info), metadata: { action: 'decode' } });
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
      clearTimeout(t);
    };
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid: boolean | null = !input.trim() ? null : error ? false : certInfo ? true : null;

  useEffect(() => {
    setStatus({
      valid,
      validityLabel: valid === null ? '' : valid ? 'Valid certificate' : 'Invalid certificate',
    });
  }, [valid, setStatus]);

  const copyText = certInfo
    ? JSON.stringify(
        {
          ...certInfo,
          notBefore: certInfo.notBefore.toISOString(),
          notAfter: certInfo.notAfter.toISOString(),
        },
        null,
        2,
      )
    : '';

  return (
    <EditorSplit>
      <Panel>
        <PanelHeader
          title="PEM certificate"
          action={
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_PEM)}>
              Load sample
            </Button>
          }
        />
        <CodeEditor
          value={input}
          onChange={setInput}
          reportStatus
          placeholder={'-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----'}
        />
      </Panel>
      <Panel>
        <PanelHeader
          title="Certificate details"
          badge={
            loading ? (
              <Badge tone="neutral">decoding…</Badge>
            ) : (
              <ValidityBadge valid={valid} validLabel="decoded" invalidLabel="invalid" />
            )
          }
          action={<CopyAction text={copyText} />}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
          {error && (
            <p
              style={{
                margin: 0,
                padding: '10px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'hsl(var(--danger))',
              }}
            >
              {error}
            </p>
          )}
          {!certInfo && !error && (
            <p
              style={{
                margin: 0,
                padding: '24px 0',
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: 'hsl(var(--text-faint))',
              }}
            >
              Paste a PEM certificate to decode
            </p>
          )}
          {certInfo && (
            <>
              <div style={{ padding: '10px 0 0' }}>
                <StatusBadge status={certInfo.validityStatus} />
              </div>

              <SectionLabel>Subject</SectionLabel>
              {Object.entries(certInfo.subject).map(([k, v]) => (
                <InfoRow key={k} label={k} value={v} />
              ))}

              <SectionLabel>Issuer</SectionLabel>
              {Object.entries(certInfo.issuer).map(([k, v]) => (
                <InfoRow key={k} label={k} value={v} />
              ))}

              <SectionLabel>Validity period</SectionLabel>
              <InfoRow label="Not Before" value={formatDate(certInfo.notBefore)} />
              <InfoRow label="Not After" value={formatDate(certInfo.notAfter)} />

              <SectionLabel>Technical details</SectionLabel>
              <InfoRow label="Serial Number" value={certInfo.serialNumber} small />
              <InfoRow label="Signature" value={certInfo.signatureAlgorithm} />
              <InfoRow
                label="Public Key"
                value={`${certInfo.publicKeyAlgorithm} (${certInfo.publicKeySize})`}
              />

              {certInfo.sans.length > 0 && (
                <>
                  <SectionLabel>Subject alternative names</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 0' }}>
                    {certInfo.sans.map((san, i) => (
                      <Badge key={i} tone="neutral">
                        {san}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              <SectionLabel>Fingerprints</SectionLabel>
              <InfoRow label="SHA-1" value={certInfo.fingerprints.sha1} small />
              <InfoRow label="SHA-256" value={certInfo.fingerprints.sha256} small />
            </>
          )}
        </div>
      </Panel>
    </EditorSplit>
  );
}
