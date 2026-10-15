import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * The result the visible tool would write with "Save Result…".
 *
 * A workbench tool keeps its output in the document, where any part of the app
 * can read it. A bespoke screen owns its result in component state instead, so
 * nothing outside the screen can reach it. Those screens publish the text they
 * would save here, and the native Save command reads this slot, which makes
 * saving behave the same in both architectures.
 *
 * The slot is deliberately single-valued and ephemeral: only one tool screen is
 * mounted at a time, and a screen withdraws its result when it unmounts or when
 * it has nothing computed yet. That is what stops "Save Result…" from writing
 * the previous tool's output after the user has moved on.
 */
interface ActiveResultState {
  /** Text to write; empty when the visible tool has no result to save. */
  text: string;
  /** What the result is, so the save confirmation can name it. */
  label: string;
  /** Extension for the suggested filename, without the dot. */
  ext: string;
  publish: (text: string, label: string, ext: string) => void;
  clear: () => void;
}

export const useActiveResult = create<ActiveResultState>()((set) => ({
  text: '',
  label: '',
  ext: 'txt',
  publish: (text, label, ext) => set({ text, label, ext }),
  clear: () => set({ text: '', label: '', ext: 'txt' }),
}));

/**
 * Publish the result a bespoke screen would save. Empty text withdraws the
 * slot rather than offering an empty file, and leaving the screen clears it.
 *
 * `ext` only names the suggested file in the save panel; it never changes what
 * the tool computed.
 */
export function usePublishedResult(text: string, label: string, ext = 'txt'): void {
  const publish = useActiveResult((s) => s.publish);
  const clear = useActiveResult((s) => s.clear);
  const trimmed = text.trim();
  useEffect(() => {
    if (trimmed) publish(text, label, ext);
    else clear();
  }, [text, trimmed, label, ext, publish, clear]);
  // Unmounting must not leave this screen's result behind for the next tool.
  useEffect(() => () => clear(), [clear]);
}
