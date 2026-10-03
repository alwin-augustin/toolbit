import type { Icon as TablerIcon } from '@tabler/icons-react';

export const INVOICE_SAMPLE =
  '{"event":"invoice.paid","invoice":{"id":"inv_1042","amount":24900,"currency":"EUR"},"customer":{"id":"cus_018","active":true}}';

export interface WorkbenchDocState {
  input: string;
  output: string;
  mode: string;
  indent: string;
  sortKeys: boolean;
  urlSafe: boolean;
  unit: string;
  zone: string;
  /** Per-tool options keyed by spec option key (select value or checkbox). */
  params: Record<string, string | boolean>;
  error: string;
  dirty: boolean;
  label: string;
}

/** Turn a native JSON parse failure into a located, actionable message. */
export function jsonErrorMessage(raw: string): string {
  try {
    JSON.parse(raw);
    return 'Invalid JSON input.';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON input.';
    const position = /position (\d+)/.exec(message)?.[1];
    if (position === undefined) return message;
    const offset = Number(position);
    const before = raw.slice(0, offset);
    const line = before.split('\n').length;
    const column = offset - before.lastIndexOf('\n');
    const detail = message.replace(/\s*at position \d+.*$/, '');
    return `${detail} (line ${line}, column ${column}). Check for missing quotes, commas, or brackets near that spot.`;
  }
}

/** Decode-then-format example recipe, executed through the canonical contracts. */

export type SpecOptionType = 'select' | 'checkbox';

export interface SpecOption {
  key: string;
  label: string;
  type: SpecOptionType;
  /** Select-only choices. */
  choices?: Array<{ value: string; label: string }>;
  /** True renders in the toolbar; otherwise lives in the Options popover. */
  inline?: boolean;
}

export interface SpecAction {
  mode: string;
  label: string;
}

export type SpecRun = (
  input: string,
  params: Record<string, string | boolean>,
  mode: string,
) => { output: string; error: string } | Promise<{ output: string; error: string }>;

/**
 * Declarative tool chrome. The workspace screen renders toolbar actions,
 * inline selects and the Options popover from this spec; run() executes the
 * canonical contract. Tools needing bespoke layouts stay out of the registry.
 */
export interface WorkbenchToolSpec {
  id: string;
  title: string;
  description: string;
  icon: TablerIcon;
  sampleInput: string;
  defaultMode: string;
  actions: SpecAction[];
  options?: SpecOption[];
  defaults?: Record<string, string | boolean>;
  run: SpecRun;
  /** Status text for a valid result. Defaults to 'Complete'. */
  resultLabel?: string;
  /** Download extension. Defaults to 'txt'. */
  fileExt?: string;
  /** Editor language. Defaults to 'text'. */
  language?: 'json' | 'text';
  /** Accuracy or scope note shown under Options. */
  note?: string;
}

export function specParams(
  doc: WorkbenchDocState,
  spec: WorkbenchToolSpec,
): Record<string, string | boolean> {
  return { ...spec.defaults, ...doc.params };
}
