import { useCallback, useRef, useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  IconArrowDown,
  IconArrowUp,
  IconCircleCheckFilled,
  IconDeviceDesktop,
  IconDownload,
  IconFileText,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { useSessionDocumentState } from '@/shared/document-state';
import { downloadBlob } from '@/shared/tool-clipboard';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export type PdfMode = 'merge' | 'split' | 'rotate';

export interface PdfFileEntry {
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  size: number;
}

export type PdfStatus = { tone: 'success' | 'danger'; message: string };

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_PDF_TOTAL_BYTES = 100 * 1024 * 1024;

/** Same byte formatting as the legacy PDF tools. */
export function formatPdfSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parse a page spec like "1-3,5" into zero-based indices, clamped to the
 * document. Shared by split and rotate; mirrors the legacy parsing exactly.
 */
export function parsePageIndices(spec: string, totalPages: number): number[] {
  const indices: number[] = [];
  for (const part of spec.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [rawStart, rawEnd] = trimmed.split('-').map(Number);
      if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) continue;
      for (let i = Math.max(1, rawStart); i <= Math.min(totalPages, rawEnd); i++) {
        indices.push(i - 1);
      }
    } else {
      const n = Number(trimmed);
      if (Number.isFinite(n) && n >= 1 && n <= totalPages) indices.push(n - 1);
    }
  }
  return indices;
}

export function splitFileName(range: string): string {
  return `split_p${range.replace(/[^0-9,-]/g, '')}.pdf`;
}

export function rotateFileName(angle: number): string {
  return `rotated_${angle}deg.pdf`;
}

/** Guard from the legacy uploader: PDF type and the 50 MB cap. */
export function validatePdfUpload(name: string, type: string, size: number): string | null {
  if (type !== 'application/pdf') return `${name} is not a PDF`;
  if (size > MAX_PDF_BYTES) return `${name} exceeds 50MB limit`;
  return null;
}

export function moveEntry<T>(entries: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= entries.length) return entries;
  const next = [...entries];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function PdfScreen() {
  const [mode, setMode] = useSessionDocumentState<PdfMode>('mode', 'merge');
  // Session-only: PDF bytes live in component state and are never persisted.
  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [splitRange, setSplitRange] = useSessionDocumentState<string>('splitRange', '1-3');
  const [rotateAngle, setRotateAngle] = useSessionDocumentState<number>('rotateAngle', 90);
  const [rotatePages, setRotatePages] = useSessionDocumentState<string>('rotatePages', 'all');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<PdfStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notify = useWorkbenchMemory((s) => s.notify);

  const addFiles = useCallback(async (fileList: FileList) => {
    const incoming: PdfFileEntry[] = [];
    let incomingBytes = 0;
    for (const file of Array.from(fileList)) {
      const problem = validatePdfUpload(file.name, file.type, file.size);
      if (problem) {
        setStatus({ tone: 'danger', message: problem });
        continue;
      }
      if (incomingBytes + file.size > MAX_PDF_TOTAL_BYTES) {
        setStatus({ tone: 'danger', message: 'Total PDF size exceeds 100 MB. Remove a file first.' });
        break;
      }
      try {
        const data = await file.arrayBuffer();
        const pdf = await PDFDocument.load(data);
        incoming.push({ name: file.name, data, pageCount: pdf.getPageCount(), size: file.size });
        incomingBytes += file.size;
      } catch {
        setStatus({ tone: 'danger', message: `Failed to load ${file.name}. It may be encrypted or corrupt.` });
      }
    }
    if (incoming.length > 0) {
      setFiles((prev) => [...prev, ...incoming].slice(0, 10));
      setStatus(null);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) void addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles],
  );

  const downloadPdf = useCallback((data: Uint8Array, filename: string) => {
    downloadBlob(new Blob([data.slice()], { type: 'application/pdf' }), filename);
  }, []);

  const mergePdfs = useCallback(async () => {
    if (files.length < 2) {
      setStatus({ tone: 'danger', message: 'Need at least 2 PDFs to merge' });
      return;
    }
    setProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const source = await PDFDocument.load(file.data);
        const pages = await merged.copyPages(source, source.getPageIndices());
        for (const page of pages) merged.addPage(page);
      }
      const data = await merged.save();
      downloadPdf(data, 'merged.pdf');
      const message = `Merged ${files.length} PDFs (${formatPdfSize(data.byteLength)})`;
      setStatus({ tone: 'success', message });
      notify(message);
    } catch (err) {
      setStatus({
        tone: 'danger',
        message: `Merge failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setProcessing(false);
    }
  }, [files, downloadPdf, notify]);

  const splitPdf = useCallback(async () => {
    if (files.length < 1) {
      setStatus({ tone: 'danger', message: 'Upload a PDF to split' });
      return;
    }
    setProcessing(true);
    try {
      const source = await PDFDocument.load(files[0].data);
      const pageIndices = parsePageIndices(splitRange, source.getPageCount());
      if (pageIndices.length === 0) {
        setStatus({ tone: 'danger', message: 'No valid pages in range' });
        return;
      }
      const next = await PDFDocument.create();
      const pages = await next.copyPages(source, pageIndices);
      for (const page of pages) next.addPage(page);
      const data = await next.save();
      downloadPdf(data, splitFileName(splitRange));
      const message = `Extracted ${pageIndices.length} pages`;
      setStatus({ tone: 'success', message });
      notify(message);
    } catch (err) {
      setStatus({
        tone: 'danger',
        message: `Split failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setProcessing(false);
    }
  }, [files, splitRange, downloadPdf, notify]);

  const rotatePdf = useCallback(async () => {
    if (files.length < 1) {
      setStatus({ tone: 'danger', message: 'Upload a PDF to rotate' });
      return;
    }
    setProcessing(true);
    try {
      const source = await PDFDocument.load(files[0].data);
      const totalPages = source.getPageCount();
      const pageIndices =
        rotatePages.trim().toLowerCase() === 'all'
          ? Array.from({ length: totalPages }, (_, i) => i)
          : parsePageIndices(rotatePages, totalPages);
      for (const idx of pageIndices) {
        const page = source.getPage(idx);
        page.setRotation(degrees((page.getRotation().angle + rotateAngle) % 360));
      }
      const data = await source.save();
      downloadPdf(data, rotateFileName(rotateAngle));
      const message = `Rotated ${pageIndices.length} pages by ${rotateAngle} degrees`;
      setStatus({ tone: 'success', message });
      notify(message);
    } catch (err) {
      setStatus({
        tone: 'danger',
        message: `Rotate failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setProcessing(false);
    }
  }, [files, rotatePages, rotateAngle, downloadPdf, notify]);

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>PDF Tools</h1>
          <p>Merge, split, and rotate PDFs locally on this device</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <button
          type="button"
          className={`wb-button${mode === 'merge' ? ' primary' : ''}`}
          aria-pressed={mode === 'merge'}
          onClick={() => setMode('merge')}
        >
          Merge
        </button>
        <button
          type="button"
          className={`wb-button${mode === 'split' ? ' primary' : ''}`}
          aria-pressed={mode === 'split'}
          onClick={() => setMode('split')}
        >
          Split / Extract
        </button>
        <button
          type="button"
          className={`wb-button${mode === 'rotate' ? ' primary' : ''}`}
          aria-pressed={mode === 'rotate'}
          onClick={() => setMode('rotate')}
        >
          Rotate
        </button>
        <button type="button" className="wb-button" onClick={() => fileInputRef.current?.click()}>
          <IconUpload size={22} stroke={1.7} aria-hidden="true" />
          Add PDF{mode === 'merge' ? 's' : ''}
        </button>
      </div>
      {status ? (
        <div className="wb-error-banner" role="alert">
          <strong>{status.tone === 'danger' ? "Couldn't process this input." : 'Done.'}</strong>
          <span>{status.message}</span>
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple={mode === 'merge'}
        aria-label="Add PDF files"
        className="wb-sr-only"
        onChange={handleFileInput}
      />

      {files.length > 0 ? (
        <>
          <div className="wb-setting-row">
            <span>
              <strong>
                {files.length} file{files.length !== 1 ? 's' : ''} — {totalPages} pages —{' '}
                {formatPdfSize(totalSize)}
              </strong>
              <small>Files stay in this session and never leave the device</small>
            </span>
            <button type="button" className="wb-button" onClick={() => setFiles([])}>
              Clear all
            </button>
          </div>
          <div>
            {files.map((file, i) => (
              <div className="wb-list-row" key={`${file.name}-${i}`}>
                <IconFileText size={22} aria-hidden="true" />
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {file.pageCount} pages · {formatPdfSize(file.size)}
                  </small>
                </span>
                <span className="wb-row-action">
                  {mode === 'merge' ? (
                    <>
                      <button
                        type="button"
                        className="wb-icon-button"
                        aria-label={`Move ${file.name} up`}
                        disabled={i === 0}
                        onClick={() => setFiles((prev) => moveEntry(prev, i, -1))}
                      >
                        <IconArrowUp size={20} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="wb-icon-button"
                        aria-label={`Move ${file.name} down`}
                        disabled={i === files.length - 1}
                        onClick={() => setFiles((prev) => moveEntry(prev, i, 1))}
                      >
                        <IconArrowDown size={20} aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="wb-icon-button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <IconTrash size={20} aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="wb-empty">
          <h2>No PDFs yet</h2>
          <p>PDF bytes stay in session memory only. 50 MB cap per file.</p>
        </div>
      )}

      {mode === 'split' && files.length > 0 ? (
        <div className="wb-toolbar">
          <label>
            Page range (e.g. 1-3 or 1,3,5-7)
            <input
              aria-label="Page range"
              value={splitRange}
              placeholder="1-3"
              onChange={(e) => setSplitRange(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="wb-button primary"
            disabled={processing}
            onClick={() => void splitPdf()}
          >
            <IconDownload size={22} stroke={1.7} aria-hidden="true" />
            {processing ? 'Processing...' : 'Extract pages'}
          </button>
        </div>
      ) : null}

      {mode === 'rotate' && files.length > 0 ? (
        <div className="wb-toolbar">
          <label>
            Rotation angle
            <select
              aria-label="Rotation angle"
              value={rotateAngle}
              onChange={(e) => setRotateAngle(Number(e.target.value))}
            >
              <option value={90}>90 degrees clockwise</option>
              <option value={180}>180 degrees</option>
              <option value={270}>270 degrees clockwise</option>
            </select>
          </label>
          <label>
            Pages
            <input
              aria-label="Pages to rotate"
              value={rotatePages}
              placeholder="all or 1-3,5"
              onChange={(e) => setRotatePages(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="wb-button primary"
            disabled={processing}
            onClick={() => void rotatePdf()}
          >
            {processing ? 'Processing...' : 'Rotate & download'}
          </button>
        </div>
      ) : null}

      {mode === 'merge' && files.length >= 2 ? (
        <div className="wb-toolbar">
          <button
            type="button"
            className="wb-button primary"
            disabled={processing}
            onClick={() => void mergePdfs()}
          >
            <IconDownload size={22} stroke={1.7} aria-hidden="true" />
            {processing ? 'Merging...' : `Merge ${files.length} PDFs`}
          </button>
        </div>
      ) : null}
    </>
  );
}
