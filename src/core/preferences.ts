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
    } catch {
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
export const usePreferences = create<{
  analytics: boolean;
  history: boolean;
  retentionDays: number;
  update: (patch: Partial<{ analytics: boolean; history: boolean; retentionDays: number }>) => void;
}>()(
  persist(
    (set) => ({ analytics: true, history: true, retentionDays: 30, update: (patch) => set(patch) }),
    {
      name: 'toolbit-preferences',
      storage: createJSONStorage(() => safeStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return {
          ...current,
          analytics: typeof p.analytics === 'boolean' ? p.analytics : current.analytics,
          history: typeof p.history === 'boolean' ? p.history : current.history,
          retentionDays:
            typeof p.retentionDays === 'number' &&
            Number.isFinite(p.retentionDays) &&
            p.retentionDays >= 1 &&
            p.retentionDays <= 365
              ? Math.floor(p.retentionDays)
              : current.retentionDays,
        };
      },
    },
  ),
);
