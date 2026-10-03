import { useMemo } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSearch,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react';
import { useDocumentField } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export interface HttpStatusEntry {
  code: number;
  phrase: string;
}

export const HTTP_STATUS_CODES: HttpStatusEntry[] = [
  { code: 100, phrase: 'Continue' },
  { code: 101, phrase: 'Switching Protocols' },
  { code: 200, phrase: 'OK' },
  { code: 201, phrase: 'Created' },
  { code: 202, phrase: 'Accepted' },
  { code: 204, phrase: 'No Content' },
  { code: 301, phrase: 'Moved Permanently' },
  { code: 302, phrase: 'Found' },
  { code: 304, phrase: 'Not Modified' },
  { code: 400, phrase: 'Bad Request' },
  { code: 401, phrase: 'Unauthorized' },
  { code: 403, phrase: 'Forbidden' },
  { code: 404, phrase: 'Not Found' },
  { code: 500, phrase: 'Internal Server Error' },
  { code: 502, phrase: 'Bad Gateway' },
  { code: 503, phrase: 'Service Unavailable' },
  { code: 504, phrase: 'Gateway Timeout' },
];

export function statusCodeLabel(entry: HttpStatusEntry): string {
  return `${entry.code} ${entry.phrase}`;
}

/** Search the reference list by code or phrase, case-insensitively. */
export function filterHttpStatuses(query: string): HttpStatusEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return HTTP_STATUS_CODES;
  return HTTP_STATUS_CODES.filter(
    (entry) => String(entry.code).includes(needle) || entry.phrase.toLowerCase().includes(needle),
  );
}

export function HttpStatusScreen() {
  const [query, setQuery] = useDocumentField<string>('query', '');
  const notify = useWorkbenchMemory((s) => s.notify);

  const results = useMemo(() => filterHttpStatuses(query), [query]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  const copyAll = () => {
    const text = results.map(statusCodeLabel).join('\n');
    void copyText(text, 'Status codes');
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Status Codes</h1>
          <p>Searchable reference list of HTTP status codes</p>
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
        <button type="button" className="wb-button primary" onClick={() => setQuery('404')}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={() => setQuery('')} disabled={!query}>
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </button>
        <button
          type="button"
          className="wb-button"
          onClick={copyAll}
          disabled={results.length === 0}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy all
        </button>
        <span className="wb-result-state">
          {results.length} of {HTTP_STATUS_CODES.length} codes
        </span>
      </div>
      <div className="wb-catalog-search">
        <IconSearch size={20} aria-hidden="true" />
        <input
          aria-label="Search status codes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or phrase…"
        />
      </div>
      {results.length === 0 ? (
        <div className="wb-empty">
          <h2>No matching codes</h2>
          <p>Try a code such as 404 or a phrase such as Not Found.</p>
        </div>
      ) : (
        results.map((entry) => (
          <div className="wb-list-row" key={entry.code}>
            <span>
              <strong data-testid={`status-code-${entry.code}`}>{entry.code}</strong>
              <small>{entry.phrase}</small>
            </span>
            <span className="wb-row-action">
              <button
                type="button"
                className="wb-button"
                aria-label={`Copy ${entry.code} ${entry.phrase}`}
                onClick={() => void copyText(statusCodeLabel(entry), statusCodeLabel(entry))}
              >
                <IconCopy size={20} aria-hidden="true" />
                Copy
              </button>
            </span>
          </div>
        ))
      )}
      <div className="wb-pane-footer">
        <span>
          {results.length === 0
            ? 'No matches'
            : `${results.length} of ${HTTP_STATUS_CODES.length} codes shown`}
        </span>
      </div>
    </>
  );
}
