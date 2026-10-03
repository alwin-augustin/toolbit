import { useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconRefresh,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';

export const FIRST_NAMES = [
  'James',
  'Mary',
  'Robert',
  'Patricia',
  'John',
  'Jennifer',
  'Michael',
  'Linda',
  'David',
  'Elizabeth',
  'William',
  'Barbara',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Emma',
  'Oliver',
  'Sophia',
  'Liam',
  'Ava',
  'Noah',
  'Isabella',
  'Lucas',
  'Mia',
  'Ethan',
  'Charlotte',
  'Mason',
];

export const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
];

export const DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'proton.me',
  'icloud.com',
  'mail.com',
  'fastmail.com',
  'zoho.com',
  'aol.com',
];

export const STREETS = [
  'Main St',
  'Oak Ave',
  'Maple Dr',
  'Cedar Ln',
  'Pine Rd',
  'Elm St',
  'Washington Blvd',
  'Park Ave',
  'Lake Dr',
  'Hill Rd',
  'Forest Way',
  'River Rd',
  'Sunset Blvd',
  'Broadway',
  'Market St',
  'Church St',
];

export const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
  'Denver',
  'Seattle',
  'Boston',
  'Portland',
  'Miami',
  'Atlanta',
];

export const STATES = [
  'NY',
  'CA',
  'IL',
  'TX',
  'AZ',
  'PA',
  'FL',
  'OH',
  'GA',
  'NC',
  'MI',
  'NJ',
  'VA',
  'WA',
  'MA',
  'CO',
  'OR',
  'IN',
  'TN',
  'MO',
];

export const COMPANIES = [
  'Acme Corp',
  'Globex Inc',
  'Initech',
  'Umbrella Corp',
  'Stark Industries',
  'Wayne Enterprises',
  'Cyberdyne Systems',
  'Soylent Corp',
  'Tyrell Corp',
  'Massive Dynamic',
  'Aperture Science',
  'Black Mesa',
  'Oscorp',
  'LexCorp',
];

export interface FakeRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  company: string;
}

export type FakeOutputFormat = 'json' | 'csv' | 'sql';
export type FakeFieldKey = keyof FakeRecord;

export const ALL_FAKE_FIELDS: { key: FakeFieldKey; label: string }[] = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'Zip' },
  { key: 'company', label: 'Company' },
];

export const DEFAULT_FAKE_FIELDS: FakeFieldKey[] = ['firstName', 'lastName', 'email', 'phone'];

/** Deterministic PRNG (mulberry32) so a seed replays the same fixtures. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)];
}

function randInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function generateFakeRecord(random: () => number = Math.random): FakeRecord {
  const firstName = pick(FIRST_NAMES, random);
  const lastName = pick(LAST_NAMES, random);
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(random, 1, 99)}@${pick(DOMAINS, random)}`,
    phone: `(${randInt(random, 200, 999)}) ${randInt(random, 200, 999)}-${randInt(random, 1000, 9999)}`,
    address: `${randInt(random, 100, 9999)} ${pick(STREETS, random)}`,
    city: pick(CITIES, random),
    state: pick(STATES, random),
    zip: String(randInt(random, 10000, 99999)),
    company: pick(COMPANIES, random),
  };
}

export function generateFakeRecords(
  count: number,
  seed: number,
  randomFactory: (seed: number) => () => number = createSeededRandom,
): FakeRecord[] {
  const random = randomFactory(seed);
  return Array.from({ length: Math.max(0, Math.trunc(count)) }, () => generateFakeRecord(random));
}

/** Same JSON/CSV/SQL shaping as the legacy generator. */
export function formatFakeRecords(
  records: FakeRecord[],
  format: FakeOutputFormat,
  fields: FakeFieldKey[],
): string {
  const filtered = records.map((r) => {
    const obj: Record<string, string> = {};
    fields.forEach((f) => {
      obj[f] = r[f];
    });
    return obj;
  });

  switch (format) {
    case 'json':
      return JSON.stringify(filtered, null, 2);
    case 'csv': {
      const header = fields.join(',');
      const rows = filtered.map((r) => fields.map((f) => `"${r[f]}"`).join(','));
      return [header, ...rows].join('\n');
    }
    case 'sql': {
      const tableName = 'users';
      const cols = fields.join(', ');
      const rows = filtered.map((r) => {
        const vals = fields.map((f) => `'${r[f].replace(/'/g, "''")}'`).join(', ');
        return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
      });
      return rows.join('\n');
    }
  }
}

export function FakeDataScreen() {
  const [count, setCount] = useSessionDocumentState<number>('count', 10);
  const [seed, setSeed] = useSessionDocumentState<number>('seed', 42);
  const [format, setFormat] = useSessionDocumentState<FakeOutputFormat>('format', 'json');
  const [fields, setFields] = useSessionDocumentState<FakeFieldKey[]>(
    'fields',
    DEFAULT_FAKE_FIELDS,
  );
  const [output, setOutput] = useSessionDocumentState<string>('output', '');
  const [error, setError] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const toggleField = (field: FakeFieldKey) => {
    setFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const generate = () => {
    if (fields.length === 0) {
      setError('Select at least one field.');
      return;
    }
    setError('');
    const safeCount = Math.max(1, Math.min(1000, Math.trunc(count) || 1));
    setCount(safeCount);
    setOutput(formatFakeRecords(generateFakeRecords(safeCount, seed), format, fields));
    notify(`${safeCount} records generated`);
  };

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify('Fixtures copied');
    } catch {
      notify('Clipboard unavailable. Select the output and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Fake Data</h1>
          <p>Generate deterministic fixture records for tests and prototypes</p>
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
        <label>
          Records
          <Input
            aria-label="Record count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 1)))
            }
          />
        </label>
        <label>
          Seed
          <Input
            aria-label="Random seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
          />
        </label>
        <label>
          Format
          <NativeSelect
            aria-label="Output format"
            value={format}
            onChange={(e) => setFormat(e.target.value as FakeOutputFormat)}
          >
            <NativeSelectOption value="json">JSON</NativeSelectOption>
            <NativeSelectOption value="csv">CSV</NativeSelectOption>
            <NativeSelectOption value="sql">SQL</NativeSelectOption>
          </NativeSelect>
        </label>
        <Button
          type="button"
          variant="default"
          className="wb-button primary"
          disabled={fields.length === 0}
          onClick={generate}
        >
          <IconRefresh size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
          Generate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!output}
          onClick={() => void copyText(output)}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
          Copy
        </Button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Fields</strong>
          <small>Same record shape as the legacy generator</small>
        </span>
        <span>
          {ALL_FAKE_FIELDS.map(({ key, label }) => (
            <label key={key} style={{ display: 'inline-flex', marginLeft: 12 }}>
              <Checkbox
                aria-label={label}
                checked={fields.includes(key)}
                onCheckedChange={() => toggleField(key)}
              />
              {label}
            </label>
          ))}
        </span>
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Fixtures panel">
          <div className="wb-pane-header">
            <h2>Fixtures</h2>
          </div>
          <CodeEditor
            value={output}
            readOnly
            wrap={wrap}
            language={format === 'json' ? 'json' : 'text'}
            label="Generated fixtures"
            placeholder="Press Generate to create test data."
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{output ? `${count} records · ${format.toUpperCase()}` : 'Nothing yet'}</span>
          </div>
        </section>
      </div>
    </>
  );
}
