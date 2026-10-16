import { describe, it, expect, beforeEach } from 'vitest';
import { deleteAllLocalData } from '@/core/privacy';
import { addHistoryEntry, getHistoryByToolId } from '@/core/history-db';
import { listWorkspaces } from '@/core/workspace-db';

/**
 * T1 coverage for "Delete all local data" (PRIVACY.md §6 / Appendix B): one
 * action removes every documented store, leaves foreign keys alone, and is
 * safe to run twice. The Playwright spec (T2.4) covers the Settings flow and
 * the reload.
 */

function remainingDatabases(): Promise<(string | undefined)[]> {
  if (typeof indexedDB.databases !== 'function') return Promise.resolve([]);
  return indexedDB.databases().then((databases) => databases.map((database) => database.name));
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('deleteAllLocalData', () => {
  it('removes every toolbit key and the theme preference, leaving foreign keys alone', async () => {
    window.localStorage.setItem('toolbit-preferences', '{"state":{}}');
    window.localStorage.setItem('toolbit:panel', 'collapsed');
    // The retired analytics channel's identifier is swept by prefix too.
    window.localStorage.setItem('toolbit:analytics-anonymous-id', 'toolbit_retired');
    window.localStorage.setItem('theme', 'dark');
    window.localStorage.setItem('unrelated-app', 'keep');
    window.sessionStorage.setItem('toolbit:smart-paste', '{"input":1}');
    window.sessionStorage.setItem('unrelated-session', 'keep');

    await deleteAllLocalData();

    expect(window.localStorage.getItem('toolbit-preferences')).toBeNull();
    expect(window.localStorage.getItem('toolbit:panel')).toBeNull();
    expect(window.localStorage.getItem('toolbit:analytics-anonymous-id')).toBeNull();
    expect(window.localStorage.getItem('theme')).toBeNull();
    expect(window.localStorage.getItem('unrelated-app')).toBe('keep');
    expect(window.sessionStorage.getItem('toolbit:smart-paste')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated-session')).toBe('keep');
  });

  it('deletes the history and workspace databases, leaving no records behind', async () => {
    await addHistoryEntry({
      toolId: 'json-formatter',
      toolName: 'JSON Formatter',
      timestamp: Date.now(),
      input: '{"seeded":true}',
    });
    await listWorkspaces(); // opens (and creates) the second database
    expect(await getHistoryByToolId('json-formatter')).toHaveLength(1);

    await deleteAllLocalData();

    expect((await remainingDatabases()).filter((name) => name?.startsWith('toolbit'))).toEqual([]);
    // A fresh read must find nothing; the read only recreates the empty schema.
    expect(await getHistoryByToolId('json-formatter')).toEqual([]);
  });

  it('is idempotent and reports the keys it removed', async () => {
    window.localStorage.setItem('toolbit-workspace', '{"state":{}}');
    const removed = await deleteAllLocalData();
    expect(removed).toContain('toolbit-workspace');
    expect(await deleteAllLocalData()).toEqual([]);
  });
});
