/** showModal with a fallback for environments without native dialog support. */
export function openDialog(node: HTMLDialogElement | null): void {
  if (!node || node.open) return;
  if (typeof node.showModal === 'function') node.showModal();
  else node.setAttribute('open', '');
}

export function closeDialog(node: HTMLDialogElement | null): void {
  if (!node || !node.open) return;
  if (typeof node.close === 'function') node.close();
  else node.removeAttribute('open');
}
