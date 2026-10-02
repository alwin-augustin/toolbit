import { safeStorage } from '@/lib/preferences';
import { TOOLS } from '@/config/tools.config';

export interface FavoriteTool {
  id: string;
  label: string;
  shortcut: string;
}

export const DEFAULT_FAVORITES: FavoriteTool[] = [
  { id: 'json-formatter', label: 'JSON', shortcut: '⌘1' },
  { id: 'jwt-decoder', label: 'JWT', shortcut: '⌘2' },
  { id: 'base64-encoder', label: 'Base64', shortcut: '⌘3' },
];

const STORAGE_KEY = 'toolbit:favorites';
const CHANGE_EVENT = 'toolbit:favorites-changed';

export function readFavoriteIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_FAVORITES.map((favorite) => favorite.id);
  try {
    const stored = JSON.parse(safeStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!Array.isArray(stored)) return DEFAULT_FAVORITES.map((favorite) => favorite.id);
    return stored.filter(
      (id): id is string => typeof id === 'string' && TOOLS.some((tool) => tool.id === id),
    );
  } catch {
    return DEFAULT_FAVORITES.map((favorite) => favorite.id);
  }
}

export function writeFavoriteIds(ids: string[]) {
  const unique = Array.from(new Set(ids)).filter((id) => TOOLS.some((tool) => tool.id === id));
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getFavoriteTools(ids: string[]): FavoriteTool[] {
  return ids.map((id, index) => {
    const tool = TOOLS.find((candidate) => candidate.id === id);
    return {
      id,
      label: tool?.name.split(' ')[0] ?? id,
      shortcut: `⌘${index + 1}`,
    };
  });
}

export { CHANGE_EVENT as FAVORITES_CHANGED_EVENT };
