import { useCallback, useEffect, useRef, useState } from 'react';
import { addHistoryEntry, getHistoryByToolId, type ToolHistoryEntry } from '@/lib/history-db';

interface AddHistoryOptions {
  input: string;
  output?: string;
  metadata?: Record<string, unknown>;
}

export function useToolHistory(toolId: string, toolName: string) {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [entries, setEntries] = useState<ToolHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    setLoading(true);
    try {
      const data = await getHistoryByToolId(toolId);
      if (mounted.current) setEntries(data);
    } catch {
      if (mounted.current) setEntries([]);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (payload: AddHistoryOptions) => {
      try {
        await addHistoryEntry({
          toolId,
          toolName,
          timestamp: Date.now(),
          input: payload.input,
          output: payload.output,
          metadata: payload.metadata,
        });
      } catch {
        /* storage failure does not change tool success */
      }
      await refresh();
    },
    [toolId, toolName, refresh],
  );

  return {
    entries,
    loading,
    refresh,
    addEntry,
  };
}
