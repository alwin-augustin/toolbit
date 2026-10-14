/**
 * Navigation model.
 *
 * One module describes where everything lives, so the rail, the context panel
 * and the command palette can never disagree about what exists. Adding a tool
 * to `content/tools.config.ts` is enough for it to appear in all three.
 */
import type { ComponentType } from 'react';
import {
  IconArrowsExchange,
  IconBinary,
  IconBolt,
  IconBookmark,
  IconBraces,
  IconClockHour4,
  IconDatabase,
  IconFileCode,
  IconHistory,
  IconHome,
  IconLayoutGrid,
  IconLetterCase,
  IconSettings,
  IconTable,
} from '@tabler/icons-react';
import { TOOLS, type ResearchCategory, type ToolMetadata } from '@/content/tools.config';

export type Section = 'home' | 'tools' | 'saved' | 'history' | 'settings';

export interface Destination {
  id: Section;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  /** Keyboard hint shown in the palette and on hover. */
  shortcut?: string;
}

/** Primary destinations, in the order they appear on the rail. */
export const DESTINATIONS: Destination[] = [
  { id: 'home', label: 'Home', href: '/', icon: IconHome, shortcut: 'G H' },
  { id: 'tools', label: 'Tools', href: '/library', icon: IconLayoutGrid, shortcut: 'G T' },
  { id: 'saved', label: 'Saved', href: '/saved', icon: IconBookmark, shortcut: 'G S' },
  { id: 'history', label: 'History', href: '/history', icon: IconHistory, shortcut: 'G Y' },
];

export const SETTINGS_DESTINATION: Destination = {
  id: 'settings',
  label: 'Settings',
  href: '/settings',
  icon: IconSettings,
  shortcut: 'G ,',
};

/** Reading order of the tool tree. Every category is listed exactly once. */
export const CATEGORY_ORDER: ResearchCategory[] = [
  'json-data',
  'yaml-config',
  'csv-tables',
  'sql-code',
  'convert',
  'encode-decode',
  'text',
  'time-numbers',
  'utilities',
];

export const CATEGORY_ICONS: Record<
  ResearchCategory,
  ComponentType<{ size?: number | string; className?: string }>
> = {
  'json-data': IconBraces,
  'yaml-config': IconFileCode,
  'csv-tables': IconTable,
  'sql-code': IconDatabase,
  convert: IconArrowsExchange,
  'encode-decode': IconBinary,
  text: IconLetterCase,
  'time-numbers': IconClockHour4,
  utilities: IconBolt,
};

export const TOOL_INDEX: ReadonlyMap<string, ToolMetadata> = new Map(
  TOOLS.map((tool) => [tool.id, tool]),
);

/** Route → tool, for resolving the active tool from the URL. */
export const TOOL_BY_PATH: ReadonlyMap<string, ToolMetadata> = new Map(
  TOOLS.map((tool) => [tool.path, tool]),
);

/** Tool ids grouped by category, in `CATEGORY_ORDER`. */
export const TOOLS_BY_CATEGORY: ReadonlyMap<ResearchCategory, ToolMetadata[]> = (() => {
  const map = new Map<ResearchCategory, ToolMetadata[]>();
  for (const category of CATEGORY_ORDER) map.set(category, []);
  for (const tool of TOOLS) map.get(tool.researchCategory)?.push(tool);
  return map;
})();

/** The section that owns a route, used to keep the rail in sync. */
export function sectionForPath(path: string): Section {
  if (path.startsWith('/library')) return 'tools';
  if (path.startsWith('/saved')) return 'saved';
  if (path.startsWith('/history')) return 'history';
  if (path.startsWith('/settings')) return 'settings';
  return 'home';
}

/** True when the route is a single tool rather than a workspace screen. */
export function isToolPath(path: string): boolean {
  return TOOL_BY_PATH.has(path);
}

/** The category a tool belongs to, for breadcrumbs and grouping. */
export function categoryOf(toolId: string): ResearchCategory | null {
  return TOOL_INDEX.get(toolId)?.researchCategory ?? null;
}
