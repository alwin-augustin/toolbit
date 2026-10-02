import { useSessionDocumentState } from '@/v2/document-state';
import { copyText } from '@/lib/clipboard';
import { useDocumentField } from '@/v2/document-state';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Copy, Check, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Button, Input, Textarea, Alert, Card, Tabs } from '@/ds/components';
import { ToolPage, SectionTitle, Field, Row } from '@/v2/restyle-kit';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

type QrMode = 'text' | 'url' | 'wifi' | 'vcard';

function buildWifiString(ssid: string, password: string, encryption: string): string {
  return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
}

function buildVCard(name: string, phone: string, email: string): string {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
}

export default function QrCodeGenerator() {
  const [mode, setMode] = useSessionDocumentState<QrMode>('mode', 'text');
  const [text, setText] = useDocumentField<string>('text', '');
  const [url, setUrl] = useDocumentField<string>('url', '');
  const [wifiSsid, setWifiSsid] = useDocumentField<string>('wifiSsid', '');
  const [wifiPassword, setWifiPassword] = useDocumentField<string>('wifiPassword', '');
  const [wifiEncryption, setWifiEncryption] = useDocumentField<string>('wifiEncryption', 'WPA');
  const [vcardName, setVcardName] = useDocumentField<string>('vcardName', '');
  const [vcardPhone, setVcardPhone] = useDocumentField<string>('vcardPhone', '');
  const [vcardEmail, setVcardEmail] = useDocumentField<string>('vcardEmail', '');
  const [size, setSize] = useSessionDocumentState('size', 256);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareState = useMemo(
    () => ({
      mode,
      text,
      url,
      wifiSsid,
      wifiPassword,
      wifiEncryption,
      vcardName,
      vcardPhone,
      vcardEmail,
      size,
    }),
    [
      mode,
      text,
      url,
      wifiSsid,
      wifiPassword,
      wifiEncryption,
      vcardName,
      vcardPhone,
      vcardEmail,
      size,
    ],
  );
  useUrlState(shareState, (state) => {
    setMode(
      state.mode === 'url' || state.mode === 'wifi' || state.mode === 'vcard' ? state.mode : 'text',
    );
    setText(typeof state.text === 'string' ? state.text : '');
    setUrl(typeof state.url === 'string' ? state.url : '');
    setWifiSsid(typeof state.wifiSsid === 'string' ? state.wifiSsid : '');
    setWifiPassword(typeof state.wifiPassword === 'string' ? state.wifiPassword : '');
    setWifiEncryption(typeof state.wifiEncryption === 'string' ? state.wifiEncryption : 'WPA');
    setVcardName(typeof state.vcardName === 'string' ? state.vcardName : '');
    setVcardPhone(typeof state.vcardPhone === 'string' ? state.vcardPhone : '');
    setVcardEmail(typeof state.vcardEmail === 'string' ? state.vcardEmail : '');
    setSize(typeof state.size === 'number' ? state.size : 256);
  });
  const { addEntry } = useToolHistory('qr-code-generator', 'QR Code Generator');

  const getContent = useCallback((): string => {
    switch (mode) {
      case 'text':
        return text;
      case 'url':
        return url;
      case 'wifi':
        return buildWifiString(wifiSsid, wifiPassword, wifiEncryption);
      case 'vcard':
        return buildVCard(vcardName, vcardPhone, vcardEmail);
    }
  }, [mode, text, url, wifiSsid, wifiPassword, wifiEncryption, vcardName, vcardPhone, vcardEmail]);

  const generate = useCallback(async () => {
    const content = getContent();
    if (!content.trim()) return;

    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);

      const svg = await QRCode.toString(content, {
        type: 'svg',
        width: size,
        margin: 2,
      });
      setQrSvg(svg);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [getContent, size]);

  // Auto-generate on content change
  useEffect(() => {
    const content = getContent();
    if (content.trim()) {
      const timer = setTimeout(() => generate(), 300);
      return () => clearTimeout(timer);
    } else {
      setQrDataUrl('');
      setQrSvg('');
    }
  }, [getContent, generate]);

  const downloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  const downloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const content = getContent();
    if (!(await copyText(content))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    addEntry({
      input: JSON.stringify({ mode, content }),
      output: content,
      metadata: { action: 'copy' },
    });
  };

  return (
    <ToolPage>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}
      >
        <Card>
          <div style={{ display: 'grid', gap: 16 }}>
            <SectionTitle>Content</SectionTitle>
            <Tabs
              variant="segment"
              items={[
                { value: 'text', label: 'Text' },
                { value: 'url', label: 'URL' },
                { value: 'wifi', label: 'WiFi' },
                { value: 'vcard', label: 'vCard' },
              ]}
              value={mode}
              onChange={(v) => setMode(v as QrMode)}
            />

            {mode === 'text' && (
              <Field label="Text">
                <Textarea
                  id="qr-text"
                  mono={false}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to encode..."
                  style={{ minHeight: 120 }}
                />
              </Field>
            )}

            {mode === 'url' && (
              <Field label="URL">
                <Input
                  id="qr-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </Field>
            )}

            {mode === 'wifi' && (
              <>
                <Field label="Network name (SSID)">
                  <Input
                    id="wifi-ssid"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="MyNetwork"
                  />
                </Field>
                <Field label="Password">
                  <Input
                    id="wifi-pass"
                    type="password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Password"
                  />
                </Field>
                <Field label="Encryption">
                  <Tabs
                    variant="segment"
                    items={[
                      { value: 'WPA', label: 'WPA' },
                      { value: 'WEP', label: 'WEP' },
                      { value: 'nopass', label: 'None' },
                    ]}
                    value={wifiEncryption}
                    onChange={setWifiEncryption}
                  />
                </Field>
              </>
            )}

            {mode === 'vcard' && (
              <>
                <Field label="Full name">
                  <Input
                    id="vcard-name"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    placeholder="John Doe"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    id="vcard-phone"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    id="vcard-email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </Field>
              </>
            )}

            <Field label={`Size: ${size}px`}>
              <input
                id="qr-size"
                type="range"
                min={128}
                max={512}
                step={32}
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'hsl(var(--primary))' }}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
            <SectionTitle>Preview</SectionTitle>
            {error && (
              <Alert tone="danger" style={{ justifySelf: 'stretch' }}>
                {error}
              </Alert>
            )}
            {qrDataUrl ? (
              <>
                <div
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid hsl(var(--border))',
                    background: '#ffffff',
                    padding: 16,
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    width={size}
                    height={size}
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <Row>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Download size={14} />}
                    onClick={downloadPng}
                  >
                    PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Download size={14} />}
                    onClick={downloadSvg}
                  >
                    SVG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={copied ? <Check size={14} /> : <Copy size={14} />}
                    onClick={copyToClipboard}
                  >
                    {copied ? 'Copied' : 'Copy content'}
                  </Button>
                </Row>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 192,
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed hsl(var(--border))',
                  color: 'hsl(var(--text-faint))',
                }}
              >
                <QrCode size={24} />
                <span style={{ fontSize: 'var(--text-sm)' }}>QR code will appear here</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ToolPage>
  );
}
