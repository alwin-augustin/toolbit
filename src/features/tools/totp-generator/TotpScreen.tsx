import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconFlask,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';

export interface TotpAccount {
  name: string;
  secret: string;
  digits: number;
  period: number;
}

export const TOTP_SAMPLE_SECRET = 'JBSWY3DPEHPK3PXP';

export function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.replace(/[=\s]/g, '').toUpperCase();
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const index = alphabet.indexOf(clean[i]);
    if (index === -1) throw new Error(`Invalid Base32 character: ${clean[i]}`);
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

export function totpCounter(period: number, unixSeconds: number): number {
  return Math.floor(unixSeconds / period);
}

export function totpTimeLeft(
  period: number,
  unixSeconds: number = Math.floor(Date.now() / 1000),
): number {
  return period - (unixSeconds % period);
}

export async function generateTotpForCounter(
  secret: string,
  digits: number,
  counter: number,
): Promise<string> {
  const key = base32Decode(secret);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, counter, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    Math.pow(10, digits);

  return code.toString().padStart(digits, '0');
}

export async function generateTotpForTime(
  secret: string,
  digits: number,
  period: number,
  unixSeconds: number,
): Promise<string> {
  return generateTotpForCounter(secret, digits, totpCounter(period, unixSeconds));
}

export async function generateTotp(
  secret: string,
  digits: number,
  period: number,
): Promise<string> {
  return generateTotpForTime(secret, digits, period, Math.floor(Date.now() / 1000));
}

export function TotpScreen() {
  const [secret, setSecret] = useDocumentField<string>('secret', '');
  const [digits, setDigits] = useSessionDocumentState<number>('digits', 6);
  const [period, setPeriod] = useSessionDocumentState<number>('period', 30);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(period);
  const [accounts, setAccounts] = useSessionDocumentState<TotpAccount[]>('accounts', []);
  const [accountName, setAccountName] = useDocumentField<string>('accountName', '');
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notify = useWorkbenchMemory((s) => s.notify);

  const generate = useCallback(async () => {
    if (!secret.trim()) {
      setCode('');
      setError('');
      return;
    }
    try {
      setError('');
      setCode(await generateTotp(secret.trim(), digits, period));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid secret key');
      setCode('');
    }
  }, [secret, digits, period]);

  useEffect(() => {
    void generate();
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = totpTimeLeft(period, now);
      setTimeLeft(remaining);
      if (remaining === period) void generate();
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generate, period]);

  const addAccount = useCallback(() => {
    if (!accountName.trim() || !secret.trim()) return;
    setAccounts([...accounts, { name: accountName.trim(), secret: secret.trim(), digits, period }]);
    setAccountName('');
  }, [accountName, secret, digits, period, accounts, setAccounts, setAccountName]);

  const removeAccount = useCallback(
    (index: number) => {
      setAccounts(accounts.filter((_, i) => i !== index));
    },
    [accounts, setAccounts],
  );

  const loadAccount = useCallback(
    (account: TotpAccount) => {
      setSecret(account.secret);
      setDigits(account.digits);
      setPeriod(account.period);
    },
    [setSecret, setDigits, setPeriod],
  );

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      notify('Code copied');
    } catch {
      notify('Clipboard unavailable. Select the code and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>TOTP</h1>
          <p>Generate time-based one-time passwords</p>
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
          onClick={() => setSecret(TOTP_SAMPLE_SECRET)}
        >
          <IconFlask size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!secret}
          onClick={() => setSecret('')}
        >
          Clear
        </Button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t generate a code.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Secret key (Base32)</strong>
          <small>Kept in this document only, never saved</small>
        </span>
        <Input
          aria-label="TOTP secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="JBSWY3DPEHPK3PXP"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Digits</strong>
          <small>Code length</small>
        </span>
        <NativeSelect
          aria-label="Digits"
          value={digits}
          onChange={(e) => setDigits(Number(e.target.value))}
        >
          <NativeSelectOption value={6}>6 digits</NativeSelectOption>
          <NativeSelectOption value={8}>8 digits</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Period</strong>
          <small>Seconds per code</small>
        </span>
        <NativeSelect
          aria-label="Period"
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
        >
          <NativeSelectOption value={30}>30 seconds</NativeSelectOption>
          <NativeSelectOption value={60}>60 seconds</NativeSelectOption>
        </NativeSelect>
      </div>
      {code ? (
        <div className="wb-setting-row">
          <span>
            <strong data-testid="totp-code">{code}</strong>
            <small>
              Expires in {timeLeft}s of {period}s
            </small>
          </span>
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            onClick={() => void copyCode()}
          >
            <IconCopy size={20} aria-hidden="true" />
            Copy
          </Button>
        </div>
      ) : (
        <div className="wb-empty">
          <h2>No code yet</h2>
          <p>Enter a Base32 secret to see the current TOTP code with countdown.</p>
        </div>
      )}
      <div className="wb-setting-row">
        <span>
          <strong>Account name</strong>
          <small>Save this secret for the session only</small>
        </span>
        <Input
          aria-label="Account name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Account name (e.g., GitHub)"
        />
      </div>
      <div className="wb-toolbar">
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!accountName.trim() || !secret.trim()}
          onClick={addAccount}
        >
          <IconPlus size={22} stroke={1.7} aria-hidden="true" />
          Save account
        </Button>
      </div>
      <div>
        {accounts.length === 0 ? (
          <div className="wb-empty">
            <h2>No saved accounts</h2>
            <p>Accounts are kept for this session only.</p>
          </div>
        ) : (
          accounts.map((account, index) => (
            <div className="wb-list-row" key={`${account.name}-${index}`}>
              <span>
                <strong>{account.name}</strong>
                <small>
                  {account.digits} digits, {account.period}s
                </small>
              </span>
              <span>
                <Button
                  type="button"
                  variant="outline"
                  className="wb-button"
                  onClick={() => loadAccount(account)}
                >
                  Load
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="wb-button"
                  aria-label={`Remove ${account.name}`}
                  onClick={() => removeAccount(index)}
                >
                  <IconTrash size={20} aria-hidden="true" />
                  Remove
                </Button>
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
