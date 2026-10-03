import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useWorkspace } from '@/shared/workspace-store';
import type { JsonValue } from '@/core/tool-contract';
export const DocumentContext = createContext<string | null>(null);
/** Single source for the bound Document id: explicit context wins, else active Tab. */
export function useDocumentId(): string | null {
  const contextId = useContext(DocumentContext);
  const activeId = useWorkspace((s) => s.activeTabId);
  return contextId ?? activeId;
}
/** Per-document state is ephemeral until explicitly saved with include-data. */
export function useDocumentField<T extends JsonValue>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const id = useDocumentId();
  const document = useWorkspace((s) => s.tabs.find((d) => d.id === id));
  const [fallback, setFallback] = useState(initial);
  const stored = document?.payload?.[key];
  const value = (
    stored !== undefined &&
    typeof stored === typeof initial &&
    Array.isArray(stored) === Array.isArray(initial)
      ? stored
      : fallback
  ) as T;
  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const current = useWorkspace.getState().tabs.find((d) => d.id === id);
      const prior = (current?.payload?.[key] ?? fallback) as T;
      const value = typeof next === 'function' ? (next as (v: T) => T)(prior) : next;
      if (current)
        useWorkspace
          .getState()
          .patchDocument(current.id, { payload: { ...current.payload, [key]: value } });
      else setFallback(value);
    },
    [id, key, fallback],
  );
  return [value, set];
}
export function useDocumentOptions<T extends Record<string, JsonValue>>(
  defaults: T,
): T & { set: (patch: Partial<T>) => void } {
  const id = useDocumentId();
  const documentOptions = useWorkspace((s) => s.tabs.find((d) => d.id === id)?.options);
  const [fallback, setFallback] = useState<T>(defaults);
  const set = useCallback(
    (patch: Partial<T>) => {
      const state = useWorkspace.getState();
      const current = state.tabs.find((d) => d.id === id);
      if (current)
        state.patchDocument(current.id, {
          options: { ...defaults, ...current.options, ...patch } as T,
        });
      else setFallback((s) => ({ ...s, ...patch }));
    },
    // defaults is a stable literal per call site; id is the only dynamic key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );
  return useMemo(
    () => ({ ...defaults, ...fallback, ...documentOptions, set }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentOptions, fallback, set],
  );
}

const sessionFields = new Map<string, Map<string, unknown>>();
useWorkspace.subscribe((state) => {
  const retained = new Set([...state.tabs, ...state.closed].map((d) => d.id));
  for (const id of sessionFields.keys()) if (!retained.has(id)) sessionFields.delete(id);
});
function serializable(value: unknown, depth = 0): value is JsonValue {
  if (depth > 40) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((v) => serializable(v, depth + 1));
  return (
    !!value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.values(value).every((v) => serializable(v, depth + 1))
  );
}
/** Adapter for legacy tool settings and file selections. Files stay session-only. */
export function useSessionDocumentState<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const id = useDocumentId();
  const [value, setValue] = useState<T>(() => {
    const saved = id ? sessionFields.get(id)?.get(key) : undefined;
    if (saved !== undefined) return saved as T;
    const document = id ? useWorkspace.getState().tabs.find((d) => d.id === id) : undefined;
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    const stored = document?.payload?.[`state:${key}`];
    return stored !== undefined &&
      typeof stored === typeof fallback &&
      Array.isArray(stored) === Array.isArray(fallback)
      ? (stored as T)
      : fallback;
  });
  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (next) =>
      setValue((previous) => {
        const value = typeof next === 'function' ? (next as (v: T) => T)(previous) : next;
        if (id) {
          const fields = sessionFields.get(id) || new Map();
          fields.set(key, value);
          sessionFields.set(id, fields);
        }
        return value;
      }),
    [id, key],
  );
  // Keep store writes out of React state updater functions.
  useEffect(() => {
    if (id && serializable(value)) {
      const document = useWorkspace.getState().tabs.find((d) => d.id === id);
      if (document)
        useWorkspace
          .getState()
          .patchDocument(id, { payload: { ...document.payload, [`state:${key}`]: value } });
    }
  }, [id, key, value]);
  return [value, set];
}
