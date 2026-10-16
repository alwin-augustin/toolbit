import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Storage denial must never prevent a transformation. */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      const isQuota =
        (typeof DOMException !== 'undefined' &&
          err instanceof DOMException &&
          (err.name === 'QuotaExceededError' || err.code === 22)) ||
        (err &&
          typeof err === 'object' &&
          (err as { name?: string }).name === 'QuotaExceededError');
      if (typeof window !== 'undefined' && isQuota) {
        window.dispatchEvent(new CustomEvent('toolbit:quota-exceeded'));
      }
      /* session only */
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* session only */
    }
  },
};

/**
 * The settings the app remembers on its own. They are local by construction:
 * the persist layer writes through `safeStorage` to localStorage, and nothing
 * else. Retired fields are dropped by `merge`, so an old stored shape can
 * never resurrect a setting the app no longer has.
 */
export const usePreferences = create<{
  history: boolean;
  retentionDays: number;
  semanticSearch: boolean;
  update: (
    patch: Partial<{ history: boolean; retentionDays: number; semanticSearch: boolean }>,
  ) => void;
}>()(
  persist(
    (set) => ({
      history: true,
      retentionDays: 30,
      // Semantic search downloads a model on first use; off until asked.
      semanticSearch: false,
      update: (patch) => set(patch),
    }),
    {
      name: 'toolbit-preferences',
      storage: createJSONStorage(() => safeStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return {
          ...current,
          history: typeof p.history === 'boolean' ? p.history : current.history,
          retentionDays:
            typeof p.retentionDays === 'number' &&
            Number.isFinite(p.retentionDays) &&
            p.retentionDays >= 1 &&
            p.retentionDays <= 365
              ? Math.floor(p.retentionDays)
              : current.retentionDays,
          semanticSearch:
            typeof p.semanticSearch === 'boolean' ? p.semanticSearch : current.semanticSearch,
        };
      },
    },
  ),
);
