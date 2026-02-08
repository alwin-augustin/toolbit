type WorkerResponse<T> =
    | { ok: true; result: T }
    | { ok: false; error: string }

interface WorkerOptions {
    timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 20_000

export async function runInWorker<T, A extends unknown[]>(
    fn: (...args: A) => T | Promise<T>,
    args: A,
    options: WorkerOptions = {},
): Promise<T> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const fnSource = fn.toString()

    const workerSource = `
const userFn = ${fnSource};
self.onmessage = async (event) => {
  const { args } = event.data || {};
  try {
    const result = await userFn(...(args || []));
    self.postMessage({ ok: true, result });
  } catch (error) {
    const message = (error && error.message) ? error.message : String(error);
    self.postMessage({ ok: false, error: message });
  }
};
`

    const blob = new Blob([workerSource], { type: "text/javascript" })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)

    return new Promise<T>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            worker.terminate()
            URL.revokeObjectURL(url)
            reject(new Error("Worker timed out"))
        }, timeoutMs)

        worker.onmessage = (event: MessageEvent<WorkerResponse<T>>) => {
            window.clearTimeout(timeout)
            worker.terminate()
            URL.revokeObjectURL(url)

            const payload = event.data
            if (payload && payload.ok) {
                resolve(payload.result)
            } else {
                reject(new Error(payload?.error || "Worker failed"))
            }
        }

        worker.onerror = (event) => {
            window.clearTimeout(timeout)
            worker.terminate()
            URL.revokeObjectURL(url)
            reject(new Error(event.message || "Worker error"))
        }

        worker.postMessage({ args })
    })
}
