import { useCallback } from 'react';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

/** Shared copy-to-clipboard with consistent fallback messaging. */
export function useCopy() {
  const notify = useWorkbenchMemory((s) => s.notify);
  return useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify(`${label} copied`);
        return true;
      } catch {
        notify('Clipboard unavailable. Select the text and copy it.');
        return false;
      }
    },
    [notify],
  );
}

/** Shared download helper: appends anchor, clicks, revokes asynchronously. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on next tick so Firefox/Safari finish the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
