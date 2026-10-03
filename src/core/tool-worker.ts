import { DEFINITIONS } from '@/core/tool-contract';
self.onmessage = async (event) => {
  const { id, input, options } = event.data as {
    id: string;
    input: string;
    options: Record<string, unknown>;
  };
  try {
    const definition = (DEFINITIONS as Record<string, (typeof DEFINITIONS)[string] | undefined>)[
      id
    ];
    if (!definition) {
      self.postMessage({ ok: false, code: 'UNSUPPORTED_VERSION' });
      return;
    }
    const parsed = definition.parse(input);
    // Preserve byte-limit and cancel semantics; callers map codes for telemetry.
    self.postMessage(
      parsed.ok ? await definition.transform(parsed.value, options as never) : parsed,
    );
  } catch {
    self.postMessage({ ok: false, code: 'INVALID_INPUT' });
  }
};
