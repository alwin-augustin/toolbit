import { create } from 'zustand';

interface RecentToolsState {
  recents: string[];
  addRecent: (toolId: string) => void;
  clearRecents: () => void;
}

const STORAGE_KEY = 'toolbit:recents';
const MAX_RECENTS = 10;

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
    }
  } catch {
    // ignore
  }
  return [];
}

function saveRecents(recents: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
  } catch {
    // quota exceeded — silent fail
  }
}

export const useRecentTools = create<RecentToolsState>((set, get) => ({
  recents: loadRecents(),

  addRecent: (toolId: string) => {
    const { recents } = get();
    const filtered = recents.filter((id) => id !== toolId);
    const next = [toolId, ...filtered].slice(0, MAX_RECENTS);
    saveRecents(next);
    set({ recents: next });
  },

  clearRecents: () => {
    saveRecents([]);
    set({ recents: [] });
  },
}));
