import { DEFINITIONS, type JsonValue, type Result } from '@/core/tool-contract';
export const WORKER_THRESHOLD = 100 * 1024;
export async function executeTool(
  id: string,
  input: string,
  options: Record<string, JsonValue>,
  signal?: AbortSignal,
): Promise<Result<string>> {
  const def = DEFINITIONS[id];
  if (!def) return { ok: false, code: 'UNSUPPORTED_VERSION' };
  if (signal?.aborted) return { ok: false, code: 'CANCELLED' };
  let result: Result<string>;
  if (input.length >= WORKER_THRESHOLD / 3 && typeof Worker !== 'undefined') {
    try {
      result = await new Promise<Result<string>>((resolve) => {
        const worker = new Worker(new URL('./tool-worker.ts', import.meta.url), {
          type: 'module',
        });
        let settled = false;
        const finish = (result: Result<string>) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', abort);
          worker.terminate();
          resolve(result);
        };
        const abort = () => finish({ ok: false, code: 'CANCELLED' });
        const timer = setTimeout(() => finish({ ok: false, code: 'CANCELLED' }), 10000);
        signal?.addEventListener('abort', abort, { once: true });
        worker.onmessage = (event) => finish(event.data);
        worker.onerror = () => finish({ ok: false, code: 'INVALID_INPUT' });
        try {
          worker.postMessage({ id, input, options });
        } catch {
          finish({ ok: false, code: 'INVALID_INPUT' });
        }
      });
    } catch {
      result = { ok: false, code: 'INVALID_INPUT' };
    }
  } else {
    const parsed = def.parse(input);
    if (!parsed.ok) return parsed;
    try {
      result = await def.transform(parsed.value, options, signal);
    } catch {
      result = { ok: false, code: 'INVALID_INPUT' };
    }
  }
  return result;
}
