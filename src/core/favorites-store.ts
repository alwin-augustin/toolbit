import { create } from 'zustand';

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;
}

const STORAGE_KEY = 'toolbit:favorites';

function loadFavorites(): string[] {
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

function saveFavorites(favorites: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // quota exceeded — silent fail
  }
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: loadFavorites(),

  toggleFavorite: (toolId: string) => {
    const { favorites } = get();
    const next = favorites.includes(toolId)
      ? favorites.filter((id) => id !== toolId)
      : [...favorites, toolId];
    saveFavorites(next);
    set({ favorites: next });
  },

  isFavorite: (toolId: string) => get().favorites.includes(toolId),
}));
