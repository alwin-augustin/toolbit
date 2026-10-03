import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFINITIONS } from '@/core/tool-contract';
import { executeTool, WORKER_THRESHOLD } from '@/core/execute-tool';

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor(
    public url: unknown,
    public opts: unknown,
  ) {}
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('executeTool main-thread path', () => {
  it('rejects unknown tools', async () => {
    await expect(executeTool('nope', '{}', {})).resolves.toEqual({
      ok: false,
      code: 'UNSUPPORTED_VERSION',
    });
  });

  it('honors pre-aborted signals', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(executeTool('json-formatter', '{}', {}, controller.signal)).resolves.toEqual({
      ok: false,
      code: 'CANCELLED',
    });
  });

  it('runs small inputs through parse+transform', async () => {
    await expect(
      executeTool('json-formatter', '{"a":1}', { indent: 2, sortKeys: false }),
    ).resolves.toEqual({ ok: true, value: '{\n  "a": 1\n}' });
  });

  it('surfaces invalid input and oversized payloads', async () => {
    await expect(executeTool('json-formatter', '{bad', {})).resolves.toEqual({
      ok: false,
      code: 'INVALID_INPUT',
    });
    await expect(executeTool('json-formatter', 'x'.repeat(11 * 1024 * 1024), {})).resolves.toEqual({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
  });

  it('converts a throwing transform into INVALID_INPUT', async () => {
    const spy = vi
      .spyOn(DEFINITIONS['json-formatter'], 'transform')
      .mockRejectedValueOnce(new Error('boom'));
    await expect(executeTool('json-formatter', '{}', {})).resolves.toEqual({
      ok: false,
      code: 'INVALID_INPUT',
    });
    expect(spy).toHaveBeenCalled();
  });
});

describe('executeTool worker path (stubbed Worker)', () => {
  const big = `{"data":"${'x'.repeat(Math.ceil(WORKER_THRESHOLD / 3))}"}`;

  it('resolves with the worker message and terminates', async () => {
    let worker: FakeWorker | null = null;
    vi.stubGlobal(
      'Worker',
      class extends FakeWorker {
        constructor(url: unknown, opts: unknown) {
          super(url, opts);
          const self = this as FakeWorker;
          worker = self;
          self.postMessage.mockImplementation(() =>
            self.onmessage?.({ data: { ok: true, value: 'worker-value' } }),
          );
        }
      },
    );
    await expect(executeTool('json-formatter', big, {})).resolves.toEqual({
      ok: true,
      value: 'worker-value',
    });
    expect(worker!.terminate).toHaveBeenCalled();
  });

  it('maps worker errors and postMessage failures to INVALID_INPUT', async () => {
    vi.stubGlobal(
      'Worker',
      class extends FakeWorker {
        constructor(url: unknown, opts: unknown) {
          super(url, opts);
          this.postMessage.mockImplementation(() => this.onerror?.());
        }
      },
    );
    await expect(executeTool('json-formatter', big, {})).resolves.toEqual({
      ok: false,
      code: 'INVALID_INPUT',
    });

    vi.stubGlobal(
      'Worker',
      class extends FakeWorker {
        constructor(url: unknown, opts: unknown) {
          super(url, opts);
          this.postMessage.mockImplementation(() => {
            throw new Error('clone failed');
          });
        }
      },
    );
    await expect(executeTool('json-formatter', big, {})).resolves.toEqual({
      ok: false,
      code: 'INVALID_INPUT',
    });
  });

  it('cancels an in-flight worker on abort', async () => {
    vi.stubGlobal('Worker', FakeWorker); // never responds
    const controller = new AbortController();
    const pending = executeTool('json-formatter', big, {}, controller.signal);
    controller.abort();
    await expect(pending).resolves.toEqual({ ok: false, code: 'CANCELLED' });
  });
});
