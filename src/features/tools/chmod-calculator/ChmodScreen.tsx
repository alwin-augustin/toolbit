import { useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconLock,
  IconSparkles,
} from '@tabler/icons-react';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** The preview every chmod calculator opens with on "Load sample". */
export const CHMOD_SAMPLE = '755';

export interface ModeClass {
  name: 'Owner' | 'Group' | 'Other';
  bits: { read: number; write: number; execute: number };
  /** Setuid, setgid, or sticky bit this class can carry. */
  special: number;
  /** Symbolic letters for the special bit when execute is set, then when it is not. */
  specialChars: ['s' | 't', 'S' | 'T'];
}

/** The three permission classes, in the order ls prints their triplets. */
const CLASSES: readonly ModeClass[] = [
  {
    name: 'Owner',
    bits: { read: 0o400, write: 0o200, execute: 0o100 },
    special: 0o4000,
    specialChars: ['s', 'S'],
  },
  {
    name: 'Group',
    bits: { read: 0o040, write: 0o020, execute: 0o010 },
    special: 0o2000,
    specialChars: ['s', 'S'],
  },
  {
    name: 'Other',
    bits: { read: 0o004, write: 0o002, execute: 0o001 },
    special: 0o1000,
    specialChars: ['t', 'T'],
  },
];

/** The three permission columns, in the order ls prints them. */
const PERMISSIONS = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
  { key: 'execute', label: 'Execute' },
] as const;

type PermissionKey = (typeof PERMISSIONS)[number]['key'];

/** Special bits occupy the leading digit of a four-digit mode. */
const SPECIAL_BITS = [
  { key: 'setuid', label: 'Setuid', bit: 0o4000 },
  { key: 'setgid', label: 'Setgid', bit: 0o2000 },
  { key: 'sticky', label: 'Sticky', bit: 0o1000 },
] as const;

/** File-type letters as `ls -l` prints them, including the plain-file dash. */
const FILE_TYPES = 'bcdlps-';
const EXECUTE_CHARS = ['xsS', 'xsS', 'xtT'];

/** Shared rejection message: the field accepts either notation. */
const OCTAL_ERROR = 'Enter 3 or 4 octal digits (0-7), or 9 symbolic characters like rwxr-xr-x.';

/**
 * Parse a 9-character symbolic mode, optionally preceded by a file-type
 * character as in `ls -l` output. Lowercase s/t also mean the execute bit is
 * set; uppercase S/T mean the special bit is set without execute.
 */
function parseSymbolic(text: string): number | null {
  const withType = text.length === 10;
  if (!withType && text.length !== 9) return null;
  if (withType && !FILE_TYPES.includes(text[0])) return null;
  const letters = withType ? text.slice(1) : text;
  let mode = 0;
  for (let i = 0; i < 3; i++) {
    const [read, write, execute] = letters.slice(i * 3, i * 3 + 3);
    const shift = (2 - i) * 3;
    if (read === 'r') mode |= 0o4 << shift;
    else if (read !== '-') return null;
    if (write === 'w') mode |= 0o2 << shift;
    else if (write !== '-') return null;
    if (execute === 'x') mode |= 0o1 << shift;
    else if (execute !== '-') {
      if (!EXECUTE_CHARS[i].includes(execute)) return null;
      mode |= CLASSES[i].special;
      if (execute === execute.toLowerCase()) mode |= 0o1 << shift;
    }
  }
  return mode;
}

/** Read an octal or symbolic mode from what the user typed. */
export function parseMode(
  input: string,
): { ok: true; mode: number } | { ok: false; error: string } {
  const text = input.trim();
  if (!text) return { ok: false, error: OCTAL_ERROR };
  if (/^[0-9]+$/.test(text)) {
    if (!/^[0-7]{3,4}$/.test(text)) {
      return {
        ok: false,
        error: /[89]/.test(text)
          ? 'Octal digits run from 0 to 7; 8 and 9 are not digits here.'
          : 'An octal mode has 3 or 4 digits, for example 755 or 4755.',
      };
    }
    return { ok: true, mode: parseInt(text, 8) };
  }
  const symbolic = parseSymbolic(text);
  if (symbolic === null) return { ok: false, error: OCTAL_ERROR };
  return { ok: true, mode: symbolic };
}

/** Three digits, or four once a special bit is set. */
export function toOctal(mode: number): string {
  const masked = mode & 0o7777;
  return masked & 0o7000
    ? masked.toString(8).padStart(4, '0')
    : (masked & 0o777).toString(8).padStart(3, '0');
}

export function toSymbolic(mode: number): string {
  let symbolic = '';
  for (const cls of CLASSES) {
    symbolic += (mode & cls.bits.read) !== 0 ? 'r' : '-';
    symbolic += (mode & cls.bits.write) !== 0 ? 'w' : '-';
    const execute = (mode & cls.bits.execute) !== 0;
    if ((mode & cls.special) !== 0) {
      symbolic += execute ? cls.specialChars[0] : cls.specialChars[1];
    } else {
      symbolic += execute ? 'x' : '-';
    }
  }
  return symbolic;
}

/** Join words with commas and a final conjunction: "read, write, and execute". */
function joinWords(words: string[], conjunction = 'and'): string {
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} ${conjunction} ${words[1]}`;
  return `${words.slice(0, -1).join(', ')}, ${conjunction} ${words[words.length - 1]}`;
}

/** "Owner", "Owner and group", "Owner, group, and others". */
function formatClasses(names: readonly string[]): string {
  const [first, ...rest] = names;
  return joinWords([
    first,
    ...rest.map((name) => (name === 'Other' ? 'others' : name.toLowerCase())),
  ]);
}

/** Terse, factual lines about what a mode allows. */
export function describeMode(mode: number): string[] {
  // Classes with identical permission sets share one line, so "Group and
  // others cannot write" covers both triples at once.
  const groups: { names: string[]; granted: PermissionKey[] }[] = [];
  for (const cls of CLASSES) {
    const granted = PERMISSIONS.filter((p) => (mode & cls.bits[p.key]) !== 0).map((p) => p.key);
    const key = granted.join(' ');
    const existing = groups.find((group) => group.granted.join(' ') === key);
    if (existing) existing.names.push(cls.name);
    else groups.push({ names: [cls.name], granted });
  }
  const lines = groups.map((group) => {
    const who = formatClasses(group.names);
    if (group.granted.length === PERMISSIONS.length) return `${who} can read, write, and execute`;
    const denied = PERMISSIONS.filter((p) => !group.granted.includes(p.key)).map((p) => p.key);
    return `${who} cannot ${joinWords(denied, 'or')}`;
  });
  lines.push(`Setuid: ${(mode & 0o4000) !== 0 ? 'yes' : 'no'}`);
  lines.push(`Setgid: ${(mode & 0o2000) !== 0 ? 'yes' : 'no'}`);
  lines.push(`Sticky: ${(mode & 0o1000) !== 0 ? 'yes' : 'no'}`);
  lines.push(`Octal ${toOctal(mode)}`);
  return lines;
}

export function ChmodScreen() {
  const [mode, setMode] = useSessionDocumentState<number>('mode', 0o644);
  // The field keeps the raw text so invalid typing survives until it parses;
  // the checkboxes only ever follow the last valid mode.
  const [octal, setOctal] = useState(() => toOctal(mode));
  const [error, setError] = useState('');
  const notify = useWorkbenchMemory((s) => s.notify);

  const command = `chmod ${toOctal(mode)} path/to/file`;
  usePublishedResult(command, 'chmod command', 'txt');

  const updateOctal = (value: string) => {
    setOctal(value);
    if (!value.trim()) {
      setError('');
      return;
    }
    const parsed = parseMode(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError('');
    setMode(parsed.mode);
  };

  const setBit = (bit: number, on: boolean) => {
    const next = on ? mode | bit : mode & ~bit;
    setMode(next);
    setOctal(toOctal(next));
    setError('');
  };

  const loadSample = () => {
    const parsed = parseMode(CHMOD_SAMPLE);
    if (!parsed.ok) return;
    setMode(parsed.mode);
    setOctal(CHMOD_SAMPLE);
    setError('');
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      notify('Command copied');
    } catch {
      notify('Clipboard unavailable. Select the command and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Chmod Calculator</h1>
          <p>Read and write Unix file permissions</p>
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
        <Button type="button" className="wb-button primary" onClick={() => void copyCommand()}>
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy command
        </Button>
      </div>
      <p className="wb-note">
        An octal mode holds special, owner, group, then other digits. In the symbolic form a
        lowercase s or t means the execute bit is set too; an uppercase S or T means it is not.
      </p>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t read that mode.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Octal</strong>
          <small>Three or four digits, or a symbolic mode</small>
        </span>
        <Input
          aria-label="Octal"
          value={octal}
          onChange={(e) => updateOctal(e.target.value)}
          placeholder="755"
        />
      </div>
      {CLASSES.map((cls) => (
        <div className="wb-setting-row" key={cls.name}>
          <span>
            <strong>{cls.name}</strong>
            <small>
              {cls.name === 'Owner'
                ? 'The user that owns the file'
                : cls.name === 'Group'
                  ? "Members of the file's group"
                  : 'Everyone else'}
            </small>
          </span>
          <span className="wb-option-list">
            {PERMISSIONS.map((permission) => (
              <Label
                key={permission.key}
                className="inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Checkbox
                  aria-label={`${cls.name} ${permission.key}`}
                  checked={(mode & cls.bits[permission.key]) !== 0}
                  onCheckedChange={(checked) => setBit(cls.bits[permission.key], Boolean(checked))}
                />
                {permission.label}
              </Label>
            ))}
          </span>
        </div>
      ))}
      <div className="wb-setting-row">
        <span>
          <strong className="inline-flex items-center gap-1.5">
            <IconLock size={16} stroke={1.7} aria-hidden="true" />
            Special bits
          </strong>
          <small>Setuid, setgid, and sticky</small>
        </span>
        <span className="wb-option-list">
          {SPECIAL_BITS.map((special) => (
            <Label key={special.key} className="inline-flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                aria-label={special.label}
                checked={(mode & special.bit) !== 0}
                onCheckedChange={(checked) => setBit(special.bit, Boolean(checked))}
              />
              {special.label}
            </Label>
          ))}
        </span>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Symbolic</strong>
          <small data-testid="chmod-symbolic">{toSymbolic(mode)}</small>
        </span>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Command</strong>
          <small data-testid="chmod-command">{command}</small>
        </span>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Summary</strong>
          <small>Mode in plain words</small>
        </span>
        <span>
          {describeMode(mode).map((line) => (
            <small key={line}>{line}</small>
          ))}
        </span>
      </div>
    </>
  );
}
