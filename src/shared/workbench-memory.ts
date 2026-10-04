import { create } from 'zustand';
import { base64Transform } from '@/core/tool-contract';
import { INVOICE_SAMPLE, type WorkbenchDocState } from '@/shared/workbench';
import { defaultDocState } from '@/features/tools/specs';

export type SavedKind = 'Sessions' | 'Examples' | 'Snippets';

export interface SavedItem {
  id: string;
  name: string;
  kind: SavedKind;
  toolId: string;
  doc: WorkbenchDocState | null;
  input: string;
  example: boolean;
}

export interface HistoryRun {
  id: string;
  name: string;
  toolId: string;
  doc: WorkbenchDocState;
}

interface WorkbenchMemory {
  saved: SavedItem[];
  runs: HistoryRun[];
  remember: boolean;
  wrap: boolean;
  toast: string;
  setRemember: (value: boolean) => void;
  setWrap: (value: boolean) => void;
  addSaved: (item: SavedItem) => void;
  addRun: (run: HistoryRun) => void;
  notify: (message: string) => void;
  clearToast: () => void;
}

const recipeInput = base64Transform(INVOICE_SAMPLE, 'encode', false);
const seedItems: SavedItem[] = [
  {
    id: 'example-session',
    name: 'Webhook inspection',
    kind: 'Sessions',
    toolId: 'json-formatter',
    doc: defaultDocState('json-formatter'),
    input: INVOICE_SAMPLE,
    example: true,
  },
  {
    id: 'example-pipeline',
    name: 'Decode webhook payload',
    kind: 'Examples',
    toolId: 'json-formatter',
    doc: null,
    input: recipeInput.ok ? recipeInput.value : '',
    example: true,
  },
  {
    id: 'example-snippet',
    name: 'Invoice event sample',
    kind: 'Snippets',
    toolId: 'json-formatter',
    doc: null,
    input: INVOICE_SAMPLE,
    example: true,
  },
];

export const useWorkbenchMemory = create<WorkbenchMemory>()((set) => ({
  saved: seedItems,
  runs: [],
  remember: false,
  wrap: true,
  toast: '',
  setRemember: (remember) => set({ remember }),
  setWrap: (wrap) => set({ wrap }),
  addSaved: (item) => set((s) => ({ saved: [item, ...s.saved].slice(0, 50) })),
  addRun: (run) => set((s) => ({ runs: [run, ...s.runs].slice(0, 20) })),
  notify: (toast) => set({ toast }),
  clearToast: () => set({ toast: '' }),
}));
