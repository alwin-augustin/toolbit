import { useCallback, useEffect, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconDownload,
  IconFlask,
  IconTrash,
} from '@tabler/icons-react';
import QRCode from 'qrcode';
import { downloadBlob, downloadDataUrl } from '@/shared/tool-clipboard';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export type QrMode = 'text' | 'url' | 'wifi' | 'vcard';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrContentFields {
  text: string;
  url: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: string;
  vcardName: string;
  vcardPhone: string;
  vcardEmail: string;
}

export const QR_SAMPLE_TEXT = 'https://example.com';
export const MAX_QR_CONTENT = 2000;

function escapeWifiField(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/:/g, '\\:');
}

function escapeVCardField(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function buildWifiString(ssid: string, password: string, encryption: string): string {
  return `WIFI:T:${escapeWifiField(encryption)};S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};;`;
}

export function buildVCard(name: string, phone: string, email: string): string {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${escapeVCardField(name)}\nTEL:${escapeVCardField(phone)}\nEMAIL:${escapeVCardField(email)}\nEND:VCARD`;
}

export function getQrContent(mode: QrMode, fields: QrContentFields): string {
  switch (mode) {
    case 'text':
      return fields.text;
    case 'url':
      return fields.url;
    case 'wifi':
      return buildWifiString(fields.wifiSsid, fields.wifiPassword, fields.wifiEncryption);
    case 'vcard':
      return buildVCard(fields.vcardName, fields.vcardPhone, fields.vcardEmail);
  }
}

export async function generateQrDataUrl(
  content: string,
  size: number,
  errorCorrection: QrErrorCorrection = 'M',
): Promise<string> {
  if (content.length > MAX_QR_CONTENT)
    throw new Error(`Content too long for QR (max ${MAX_QR_CONTENT} characters).`);
  return QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    errorCorrectionLevel: errorCorrection,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export async function generateQrSvg(
  content: string,
  size: number,
  errorCorrection: QrErrorCorrection = 'M',
): Promise<string> {
  if (content.length > MAX_QR_CONTENT)
    throw new Error(`Content too long for QR (max ${MAX_QR_CONTENT} characters).`);
  return QRCode.toString(content, {
    type: 'svg',
    width: size,
    margin: 2,
    errorCorrectionLevel: errorCorrection,
  });
}

const MODES: { value: QrMode; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'url', label: 'URL' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'vcard', label: 'vCard' },
];

export function QrScreen() {
  const [mode, setMode] = useSessionDocumentState<QrMode>('mode', 'text');
  const [text, setText] = useDocumentField<string>('text', '');
  const [url, setUrl] = useDocumentField<string>('url', '');
  const [wifiSsid, setWifiSsid] = useDocumentField<string>('wifiSsid', '');
  const [wifiPassword, setWifiPassword] = useDocumentField<string>('wifiPassword', '');
  const [wifiEncryption, setWifiEncryption] = useDocumentField<string>('wifiEncryption', 'WPA');
  const [vcardName, setVcardName] = useDocumentField<string>('vcardName', '');
  const [vcardPhone, setVcardPhone] = useDocumentField<string>('vcardPhone', '');
  const [vcardEmail, setVcardEmail] = useDocumentField<string>('vcardEmail', '');
  const [size, setSize] = useSessionDocumentState<number>('size', 256);
  const [errorCorrection, setErrorCorrection] = useSessionDocumentState<QrErrorCorrection>(
    'errorCorrection',
    'M',
  );
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [error, setError] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const getContent = useCallback((): string => {
    return getQrContent(mode, {
      text,
      url,
      wifiSsid,
      wifiPassword,
      wifiEncryption,
      vcardName,
      vcardPhone,
      vcardEmail,
    });
  }, [mode, text, url, wifiSsid, wifiPassword, wifiEncryption, vcardName, vcardPhone, vcardEmail]);

  const generate = useCallback(async () => {
    const content = getContent();
    if (!content.trim()) return;
    try {
      const [dataUrl, svg] = await Promise.all([
        generateQrDataUrl(content, size, errorCorrection),
        generateQrSvg(content, size, errorCorrection),
      ]);
      setQrDataUrl(dataUrl);
      setQrSvg(svg);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  }, [getContent, size, errorCorrection]);

  useEffect(() => {
    const content = getContent();
    if (content.trim()) {
      const timer = window.setTimeout(() => void generate(), 300);
      return () => window.clearTimeout(timer);
    }
    setQrDataUrl('');
    setQrSvg('');
    setError('');
  }, [getContent, generate]);

  const loadSample = () => {
    setMode('url');
    setUrl(QR_SAMPLE_TEXT);
  };

  const clear = () => {
    setText('');
    setUrl('');
    setWifiSsid('');
    setWifiPassword('');
    setVcardName('');
    setVcardPhone('');
    setVcardEmail('');
    setQrDataUrl('');
    setQrSvg('');
    setError('');
  };

  const downloadPng = () => {
    if (!qrDataUrl) return;
    downloadDataUrl(qrDataUrl, 'qrcode.png');
  };

  const downloadSvg = () => {
    if (!qrSvg) return;
    downloadBlob(new Blob([qrSvg], { type: 'image/svg+xml' }), 'qrcode.svg');
  };

  const copyContent = async () => {
    const content = getContent();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      notify('Content copied');
    } catch {
      notify('Clipboard unavailable. Select the content and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>QR Code</h1>
          <p>Generate QR codes</p>
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
        {MODES.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={`wb-button${mode === entry.value ? ' primary' : ''}`}
            onClick={() => setMode(entry.value)}
          >
            {entry.label}
          </button>
        ))}
        <button type="button" className="wb-button primary" onClick={loadSample}>
          <IconFlask size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={clear}>
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t generate this QR code.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      {mode === 'text' ? (
        <div className="wb-editors">
          <section className="wb-editor-pane" aria-label="Text panel">
            <div className="wb-pane-header">
              <h2>Text</h2>
            </div>
            <CodeEditor
              value={text}
              onChange={setText}
              wrap={wrap}
              label="QR text"
              placeholder="Enter text to encode..."
              showLineNumbers={false}
            />
            <div className="wb-pane-footer">
              <span>{text.length} characters</span>
            </div>
          </section>
          <section className="wb-editor-pane" aria-label="Preview panel">
            <div className="wb-pane-header">
              <h2>Preview</h2>
            </div>
            {qrDataUrl ? (
              <div className="wb-empty">
                <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
              </div>
            ) : (
              <div className="wb-empty">
                <h2>No QR code yet</h2>
                <p>Enter text to see the QR code.</p>
              </div>
            )}
            <div className="wb-pane-footer">
              <span>{qrDataUrl ? `${size}px · EC ${errorCorrection}` : 'Waiting for input'}</span>
            </div>
          </section>
        </div>
      ) : null}
      {mode === 'url' ? (
        <div className="wb-setting-row">
          <span>
            <strong>URL</strong>
            <small>Link encoded in the QR code</small>
          </span>
          <input
            aria-label="QR URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            inputMode="url"
          />
        </div>
      ) : null}
      {mode === 'wifi' ? (
        <>
          <div className="wb-setting-row">
            <span>
              <strong>Network name (SSID)</strong>
              <small>WiFi network name</small>
            </span>
            <input
              aria-label="WiFi SSID"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              placeholder="MyNetwork"
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Password</strong>
              <small>Kept in this document only</small>
            </span>
            <input
              type="password"
              aria-label="WiFi password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder="Password"
              autoComplete="off"
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Encryption</strong>
              <small>WiFi security type</small>
            </span>
            <NativeSelect
              aria-label="WiFi encryption"
              value={wifiEncryption}
              onChange={(e) => setWifiEncryption(e.target.value)}
            >
              <NativeSelectOption value="WPA">WPA</NativeSelectOption>
              <NativeSelectOption value="WEP">WEP</NativeSelectOption>
              <NativeSelectOption value="nopass">None</NativeSelectOption>
            </NativeSelect>
          </div>
        </>
      ) : null}
      {mode === 'vcard' ? (
        <>
          <div className="wb-setting-row">
            <span>
              <strong>Full name</strong>
              <small>Contact display name</small>
            </span>
            <input
              aria-label="Contact name"
              value={vcardName}
              onChange={(e) => setVcardName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Phone</strong>
              <small>Contact phone number</small>
            </span>
            <input
              aria-label="Contact phone"
              value={vcardPhone}
              onChange={(e) => setVcardPhone(e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Email</strong>
              <small>Contact email address</small>
            </span>
            <input
              aria-label="Contact email"
              value={vcardEmail}
              onChange={(e) => setVcardEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Size: {size}px</strong>
          <small>128 to 512 pixels</small>
        </span>
        <input
          type="range"
          aria-label="QR size"
          min={128}
          max={512}
          step={32}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Error correction</strong>
          <small>Higher levels survive more damage</small>
        </span>
        <NativeSelect
          aria-label="Error correction"
          value={errorCorrection}
          onChange={(e) => setErrorCorrection(e.target.value as QrErrorCorrection)}
        >
          <NativeSelectOption value="L">L (7%)</NativeSelectOption>
          <NativeSelectOption value="M">M (15%)</NativeSelectOption>
          <NativeSelectOption value="Q">Q (25%)</NativeSelectOption>
          <NativeSelectOption value="H">H (30%)</NativeSelectOption>
        </NativeSelect>
      </div>
      {mode !== 'text' ? (
        <>
          {qrDataUrl ? (
            <div className="wb-list-row">
              <span>
                <strong>QR preview</strong>
                <small>
                  {size}px · EC {errorCorrection}
                </small>
              </span>
              <span>
                <img src={qrDataUrl} alt="QR Code" width={128} height={128} />
              </span>
            </div>
          ) : (
            <div className="wb-empty">
              <h2>No QR code yet</h2>
              <p>Add content to see the QR code.</p>
            </div>
          )}
        </>
      ) : null}
      <div className="wb-toolbar">
        <button
          type="button"
          className="wb-button primary"
          disabled={!qrDataUrl}
          onClick={downloadPng}
        >
          <IconDownload size={22} stroke={1.7} aria-hidden="true" />
          Download PNG
        </button>
        <button type="button" className="wb-button" disabled={!qrSvg} onClick={downloadSvg}>
          <IconDownload size={22} stroke={1.7} aria-hidden="true" />
          Download SVG
        </button>
        <button type="button" className="wb-button" onClick={() => void copyContent()}>
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy content
        </button>
      </div>
    </>
  );
}
