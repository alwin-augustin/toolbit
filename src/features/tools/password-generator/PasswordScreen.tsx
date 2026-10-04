import { useCallback, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export const PASSWORD_CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: "!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
};

export interface PasswordCharsetOptions {
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export function buildPasswordCharset(options: PasswordCharsetOptions): string {
  let charset = '';
  if (options.includeLowercase) charset += PASSWORD_CHARSETS.lowercase;
  if (options.includeUppercase) charset += PASSWORD_CHARSETS.uppercase;
  if (options.includeNumbers) charset += PASSWORD_CHARSETS.numbers;
  if (options.includeSymbols) charset += PASSWORD_CHARSETS.symbols;
  return charset;
}

export function createPassword(
  charset: string,
  length: number,
  randomValues: ArrayLike<number>,
): string {
  if (!charset) throw new Error('Select at least one character type');
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

export function generatePasswords(
  charset: string,
  length: number,
  count: number,
  getRandom: (count: number) => Uint32Array,
): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(createPassword(charset, length, getRandom(length)));
  }
  return results;
}

export function getPasswordRandomValues(count: number): Uint32Array {
  return crypto.getRandomValues(new Uint32Array(count));
}

export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  const uniqueChars = new Set(password).size;
  if (uniqueChars > password.length * 0.7) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: 'hsl(var(--danger))' };
  if (score <= 4) return { score, label: 'Medium', color: 'hsl(var(--warning))' };
  return { score, label: score <= 5 ? 'Strong' : 'Very Strong', color: 'hsl(var(--success))' };
}

export function PasswordScreen() {
  const [length, setLength] = useSessionDocumentState<number>('length', 16);
  const [includeLowercase, setIncludeLowercase] = useSessionDocumentState<boolean>(
    'includeLowercase',
    true,
  );
  const [includeUppercase, setIncludeUppercase] = useSessionDocumentState<boolean>(
    'includeUppercase',
    true,
  );
  const [includeNumbers, setIncludeNumbers] = useSessionDocumentState<boolean>(
    'includeNumbers',
    true,
  );
  const [includeSymbols, setIncludeSymbols] = useSessionDocumentState<boolean>(
    'includeSymbols',
    true,
  );
  const [count, setCount] = useSessionDocumentState<number>('count', 1);
  const [passwords, setPasswords] = useSessionDocumentState<string[]>('passwords', []);
  const [error, setError] = useState('');
  const notify = useWorkbenchMemory((s) => s.notify);

  const generate = useCallback(() => {
    const charset = buildPasswordCharset({
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols,
    });
    if (!charset) {
      setError('Select at least one character type');
      return;
    }
    setError('');
    setPasswords(generatePasswords(charset, length, count, getPasswordRandomValues));
  }, [
    includeLowercase,
    includeUppercase,
    includeNumbers,
    includeSymbols,
    length,
    count,
    setPasswords,
  ]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  const clear = () => {
    setPasswords([]);
    setError('');
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Password</h1>
          <p>Generate secure passwords</p>
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
        <Button type="button" className="wb-button primary" onClick={generate}>
          <IconRefresh size={22} stroke={1.7} aria-hidden="true" />
          Generate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={passwords.length === 0}
          onClick={() => void copyText(passwords.join('\n'), 'Passwords')}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy all
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={passwords.length === 0 && !error}
          onClick={clear}
        >
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t generate passwords.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Length: {length}</strong>
          <small>4 to 128 characters</small>
        </span>
        <Slider
          aria-label="Password length"
          min={4}
          max={128}
          value={length}
          onValueChange={(val) => setLength(typeof val === 'number' ? val : val[0])}
          className="max-w-xs"
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Count</strong>
          <small>How many passwords to generate (1 to 50)</small>
        </span>
        <Input
          type="number"
          aria-label="Password count"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Lowercase</strong>
          <small>a to z</small>
        </span>
        <Checkbox
          aria-label="Include lowercase"
          checked={includeLowercase}
          onCheckedChange={(checked) => setIncludeLowercase(Boolean(checked))}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Uppercase</strong>
          <small>A to Z</small>
        </span>
        <Checkbox
          aria-label="Include uppercase"
          checked={includeUppercase}
          onCheckedChange={(checked) => setIncludeUppercase(Boolean(checked))}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Numbers</strong>
          <small>0 to 9</small>
        </span>
        <Checkbox
          aria-label="Include numbers"
          checked={includeNumbers}
          onCheckedChange={(checked) => setIncludeNumbers(Boolean(checked))}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Symbols</strong>
          <small>!@#$ and more</small>
        </span>
        <Checkbox
          aria-label="Include symbols"
          checked={includeSymbols}
          onCheckedChange={(checked) => setIncludeSymbols(Boolean(checked))}
        />
      </div>
      <div>
        {passwords.length === 0 ? (
          <div className="wb-empty">
            <h2>No passwords yet</h2>
            <p>Choose options and press Generate. Passwords never leave this device.</p>
          </div>
        ) : (
          passwords.map((password, index) => {
            const strength = calculatePasswordStrength(password);
            return (
              <div className="wb-list-row" key={`${index}-${password.length}`}>
                <span>
                  <strong data-testid="password-output">{password}</strong>
                  <small>
                    {strength.label} ({strength.score}/7)
                  </small>
                </span>
                <span>
                  <Button
                    type="button"
                    variant="outline"
                    className="wb-button"
                    aria-label="Copy password"
                    onClick={() => void copyText(password, 'Password')}
                  >
                    <IconCopy size={20} aria-hidden="true" />
                    Copy
                  </Button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
