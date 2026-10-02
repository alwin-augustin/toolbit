import { useEffect, useMemo, useState, useRef } from 'react';
import {
  base64Transform,
  formatJson,
  INPUT_LIMIT,
  type JsonValue,
  type Result,
} from '@/lib/tool-contract';
import { executeTool, WORKER_THRESHOLD } from '@/lib/execute-tool';
import { track } from '@/lib/telemetry';
export function useCanonicalTransform(
  id: string,
  input: string,
  options: Record<string, JsonValue>,
) {
  const controllerRef = useRef<AbortController | null>(null);
  const serialized = JSON.stringify(options);
  // A conservative UTF-16 threshold avoids allocating a second copy on the UI thread.
  // The worker validates the exact UTF-8 limit before transforming.
  const large = input.length >= WORKER_THRESHOLD / 3;
  const [background, setBackground] = useState<{ key: string; result: Result<string> } | null>(
    null,
  );
  const key = useMemo(() => id + serialized + input, [id, serialized, input]);
  const sync = useMemo(() => {
    if (!input.trim()) return null;
    if (input.length > INPUT_LIMIT) return { ok: false, code: 'INPUT_TOO_LARGE' } as Result<string>;
    if (large) return null;
    return id === 'json-formatter'
      ? formatJson(input, Number(options.indent), Boolean(options.sortKeys))
      : base64Transform(input, String(options.mode), Boolean(options.urlSafe));
    // Options serialized intentionally provides a stable dependency.
  }, [id, input, serialized, large]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!large || !input.trim()) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    executeTool(id, input, JSON.parse(serialized), controller.signal).then((result) => {
      if (!controller.signal.aborted) setBackground({ key, result });
    });
    return () => controller.abort();
  }, [id, input, serialized, key, large]);
  useEffect(() => {
    if (sync)
      track(sync.ok ? 'transform_succeeded' : 'transform_failed', {
        tool_id: id,
        duration_bucket: 'fast',
        byte_bucket: 'small',
        ...(!sync.ok
          ? { error_code: sync.code === 'UNSUPPORTED_VERSION' ? 'INVALID_INPUT' : sync.code }
          : {}),
      });
  }, [sync, id]);
  const result = large ? (background?.key === key ? background.result : null) : sync;
  return {
    output: result?.ok
      ? result.value
      : result
        ? 'Invalid input. Previous valid output is retained.'
        : '',
    valid: result ? result.ok : null,
    warning: result?.ok ? result.warning : undefined,
    cancel: () => {
      controllerRef.current?.abort();
      setBackground({ key, result: { ok: false, code: 'CANCELLED' } });
    },
    busy: large && !result,
  };
}
