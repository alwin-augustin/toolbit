import { track } from './telemetry';
function announce(success: boolean) {
  window.dispatchEvent(new CustomEvent('toolbit-copy-result', { detail: success }));
  return success;
}
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    track('output_copied', { tool_id: window.location.pathname.split('/').filter(Boolean).at(-1) });
    return announce(true);
  } catch {
    const previous = document.activeElement as HTMLElement | null;
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    try {
      const copied = document.execCommand('copy');
      if (copied)
        track('output_copied', {
          tool_id: window.location.pathname.split('/').filter(Boolean).at(-1),
        });
      return announce(copied);
    } catch {
      return announce(false);
    } finally {
      field.remove();
      previous?.focus();
    }
  }
}
