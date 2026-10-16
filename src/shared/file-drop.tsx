import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';

/**
 * Drag-and-drop and open-file support for text tools on the web.
 *
 * The desktop shell has native file access; in the browser the missing piece
 * is a way in, so this hook reads a dropped or chosen file as UTF-8 text and
 * hands it to the screen. The picker is created on demand rather than rendered,
 * because every screen places its own "Open" affordance in its own toolbar.
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface FileDropHandlers {
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

export function useFileDrop(
  onText: (text: string, file: File) => void,
  onRejected?: (message: string) => void,
): { dragging: boolean; dropHandlers: FileDropHandlers; pickFile: () => void } {
  const [dragging, setDragging] = useState(false);
  const endpoint = useRef(onText);
  useEffect(() => {
    endpoint.current = onText;
  }, [onText]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        onRejected?.(`${file.name} is larger than 5 MB.`);
        return;
      }
      try {
        const text = await file.text();
        endpoint.current(text, file);
      } catch {
        onRejected?.(`Could not read ${file.name}.`);
      }
    },
    [onRejected],
  );

  const dropHandlers: FileDropHandlers = {
    onDragOver: (event) => {
      if (!event.dataTransfer.types.includes('Files')) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: (event) => {
      // Moving onto a child still counts as inside the drop target.
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) return;
      setDragging(false);
    },
    onDrop: (event) => {
      event.preventDefault();
      setDragging(false);
      void handleFiles(event.dataTransfer.files);
    },
  };

  const pickFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => void handleFiles(input.files);
    input.click();
  }, [handleFiles]);

  return { dragging, dropHandlers, pickFile };
}

/** Dashed overlay shown while a file hovers over a drop target. */
export function FileDropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-canvas/90 text-sm font-medium">
      Drop a file to load its contents
    </div>
  );
}
