import type { ComponentType } from 'react';
import { TOOLS } from '@/content/tools.config';
import { DEFINITIONS } from '@/core/tool-contract';
import { CUSTOM_SCREENS, isCustomToolId } from '@/features/tools/custom-screens';
import { isWorkbenchToolId } from '@/features/tools/specs';

export interface UnifiedToolEntry {
  id: string;
  name: string;
  path: string;
  kind: 'workbench' | 'custom' | 'catalog';
  hasContract: boolean;
  component?: ComponentType;
}

/** Single view over catalog, workbench specs, custom screens, and contract definitions. */
export function getUnifiedRegistry(): UnifiedToolEntry[] {
  return TOOLS.map((t) => {
    const kind = isWorkbenchToolId(t.id)
      ? 'workbench'
      : isCustomToolId(t.id)
        ? 'custom'
        : 'catalog';
    return {
      id: t.id,
      name: t.name,
      path: t.path,
      kind,
      hasContract: t.id in DEFINITIONS,
      component: CUSTOM_SCREENS[t.id] ?? t.component,
    };
  });
}

/** Adding a Tool requires: catalog entry + one of (workbench spec | custom screen | catalog component). */
export function validateToolRegistry(): string[] {
  const errors: string[] = [];
  for (const entry of getUnifiedRegistry()) {
    if (entry.kind === 'workbench') continue;
    if (!entry.component)
      errors.push(`Tool ${entry.id} has no component (workbench/custom/catalog).`);
  }
  // Contract coverage is optional during migration but must not diverge when present.
  return errors;
}
