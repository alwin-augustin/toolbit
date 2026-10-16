/**
 * Cloudflare Pages rejects any file over 25 MiB, and it only says so at upload
 * time — which is how a 26 MB asset that Vite emitted for an unreachable
 * onnxruntime fallback (see `dropUnusedOrtWasm` in vite.config.ts) turned the
 * deploy red while the build stayed green. Failing here instead names the file
 * on the machine that produced it, before a push can ship it.
 */
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const LIMIT_BYTES = 25 * 1024 * 1024;

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const files = [];
for await (const path of walk(DIST)) {
  files.push({ path, size: (await stat(path)).size });
}

const oversized = files.filter((file) => file.size > LIMIT_BYTES);
if (oversized.length > 0) {
  for (const file of oversized) {
    console.error(
      `SIZE: ${relative(process.cwd(), file.path)} is ${mib(file.size)} — Cloudflare Pages caps files at 25 MiB`,
    );
  }
  process.exit(1);
}

const largest = files.reduce((a, b) => (b.size > a.size ? b : a));
console.log(
  `SIZE: ${files.length} files, largest is ${mib(largest.size)} (${relative(process.cwd(), largest.path)}) — under the Cloudflare Pages 25 MiB cap`,
);
