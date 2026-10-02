import { useSessionDocumentState } from '@/v2/document-state';
import { useState, useCallback, useRef, useMemo } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Alert, Button, Card, IconButton, Select, Input, Tabs } from '@/ds/components';
import { ToolPage, SectionTitle, Field, Row, Grid2 } from '@/v2/restyle-kit';
import {
  FileText,
  Merge,
  Scissors,
  RotateCw,
  Trash2,
  Download,
  ArrowUp,
  ArrowDown,
  Upload,
} from 'lucide-react';
import { useUrlState } from '@/hooks/use-url-state';

interface PdfFile {
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  size: number;
}

type Mode = 'merge' | 'split' | 'rotate';

type Status = { tone: 'success' | 'danger'; message: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfTools() {
  const [mode, setMode] = useSessionDocumentState<Mode>('mode', 'merge');
  const [files, setFiles] = useSessionDocumentState<PdfFile[]>('files', []);
  const [splitRange, setSplitRange] = useSessionDocumentState('splitRange', '1-3');
  const [rotateAngle, setRotateAngle] = useSessionDocumentState('rotateAngle', 90);
  const [rotatePages, setRotatePages] = useSessionDocumentState('rotatePages', 'all');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareState = useMemo(
    () => ({ mode, splitRange, rotateAngle, rotatePages }),
    [mode, splitRange, rotateAngle, rotatePages],
  );
  useUrlState(shareState, (state) => {
    setMode(state.mode === 'split' || state.mode === 'rotate' ? state.mode : 'merge');
    setSplitRange(typeof state.splitRange === 'string' ? state.splitRange : '1-3');
    setRotateAngle(typeof state.rotateAngle === 'number' ? state.rotateAngle : 90);
    setRotatePages(typeof state.rotatePages === 'string' ? state.rotatePages : 'all');
  });

  const addFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: PdfFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type !== 'application/pdf') {
          setStatus({ tone: 'danger', message: `${file.name} is not a PDF` });
          continue;
        }
        if (file.size > 50 * 1024 * 1024) {
          setStatus({ tone: 'danger', message: `${file.name} exceeds 50MB limit` });
          continue;
        }
        try {
          const data = await file.arrayBuffer();
          const pdf = await PDFDocument.load(data);
          newFiles.push({ name: file.name, data, pageCount: pdf.getPageCount(), size: file.size });
        } catch {
          setStatus({ tone: 'danger', message: `Failed to load ${file.name}` });
        }
      }
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [setFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [setFiles],
  );

  const moveFile = useCallback(
    (index: number, direction: -1 | 1) => {
      setFiles((prev) => {
        const next = [...prev];
        const target = index + direction;
        if (target < 0 || target >= next.length) return prev;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    },
    [setFiles],
  );

  const downloadPdf = useCallback((data: Uint8Array, filename: string) => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
      setStatus({
        tone: 'success',
        message: `Merged ${files.length} PDFs (${formatSize(data.byteLength)})`,
      });
    } catch (err) {
      setStatus({
        tone: 'danger',
        message: `Merge failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setProcessing(false);
    }
  }, [files, downloadPdf]);

  const splitPdf = useCallback(async () => {
    if (files.length < 1) {
      setStatus({ tone: 'danger', message: 'Upload a PDF to split' });
      return;
    }
    setProcessing(true);
    try {
      const source = await PDFDocument.load(files[0].data);
      const totalPages = source.getPageCount();

      // Parse page range (e.g., "1-3", "1,3,5", "1-3,5-7")
      const pageIndices: number[] = [];
      for (const part of splitRange.split(',')) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            pageIndices.push(i - 1);
          }
        } else {
          const n = Number(trimmed);
          if (n >= 1 && n <= totalPages) pageIndices.push(n - 1);
        }
      }

      if (pageIndices.length === 0) {
        setStatus({ tone: 'danger', message: 'No valid pages in range' });
        return;
      }

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(source, pageIndices);
      for (const page of pages) newPdf.addPage(page);

      const data = await newPdf.save();
      downloadPdf(data, `split_p${splitRange.replace(/[^0-9,-]/g, '')}.pdf`);
      setStatus({ tone: 'success', message: `Extracted ${pageIndices.length} pages` });
    } catch (err) {
      setStatus({
        tone: 'danger',
        message: `Split failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setProcessing(false);
    }
  }, [files, splitRange, downloadPdf]);

  const rotatePdf = useCallback(async () => {
    if (files.length < 1) {
      setStatus({ tone: 'danger', message: 'Upload a PDF to rotate' });
      return;
    }
    setProcessing(true);
    try {
      const source = await PDFDocument.load(files[0].data);
      const totalPages = source.getPageCount();

      let pageIndices: number[];
      if (rotatePages === 'all') {
        pageIndices = Array.from({ length: totalPages }, (_, i) => i);
      } else {
        pageIndices = [];
        for (const part of rotatePages.split(',')) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [s, e] = trimmed.split('-').map(Number);
            for (let i = Math.max(1, s); i <= Math.min(totalPages, e); i++) pageIndices.push(i - 1);
          } else {
            const n = Number(trimmed);
            if (n >= 1 && n <= totalPages) pageIndices.push(n - 1);
          }
        }
      }

      for (const idx of pageIndices) {
        const page = source.getPage(idx);
        page.setRotation(degrees((page.getRotation().angle + rotateAngle) % 360));
      }

      const data = await source.save();
      downloadPdf(data, `rotated_${rotateAngle}deg.pdf`);
      setStatus({
        tone: 'success',
        message: `Rotated ${pageIndices.length} pages by ${rotateAngle} degrees`,
      });
    } catch (err) {
      setStatus({
        tone: 'danger',
        message: `Rotate failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setProcessing(false);
    }
  }, [files, rotateAngle, rotatePages, downloadPdf]);

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <ToolPage maxWidth={760}>
      <Row>
        <Tabs
          variant="segment"
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          items={[
            { value: 'merge', label: 'Merge', icon: <Merge size={14} /> },
            { value: 'split', label: 'Split / Extract', icon: <Scissors size={14} /> },
            { value: 'rotate', label: 'Rotate', icon: <RotateCw size={14} /> },
          ]}
        />
      </Row>

      {status && <Alert tone={status.tone}>{status.message}</Alert>}

      <Card>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 8,
            padding: '28px 16px',
            border: '2px dashed hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            color: 'hsl(var(--text-muted))',
            textAlign: 'center',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple={mode === 'merge'}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <Upload size={28} />
          <span style={{ fontSize: 'var(--text-sm)' }}>
            Click or drag PDF files here {mode === 'merge' ? '(multiple)' : '(single)'}
          </span>
        </div>
      </Card>

      {files.length > 0 && (
        <Card>
          <div style={{ display: 'grid', gap: 8 }}>
            <Row>
              <SectionTitle>
                {files.length} file{files.length !== 1 ? 's' : ''} — {totalPages} pages —{' '}
                {formatSize(totalSize)}
              </SectionTitle>
              <div style={{ marginLeft: 'auto' }}>
                <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                  Clear all
                </Button>
              </div>
            </Row>
            {files.map((file, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--surface-1))',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <FileText size={16} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'hsl(var(--text-strong))',
                  }}
                >
                  {file.name}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--text-muted))' }}>
                  {file.pageCount} pg
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--text-muted))' }}>
                  {formatSize(file.size)}
                </span>
                {mode === 'merge' && (
                  <>
                    <IconButton
                      size="sm"
                      title="Move up"
                      onClick={() => moveFile(i, -1)}
                      disabled={i === 0}
                    >
                      <ArrowUp size={12} />
                    </IconButton>
                    <IconButton
                      size="sm"
                      title="Move down"
                      onClick={() => moveFile(i, 1)}
                      disabled={i === files.length - 1}
                    >
                      <ArrowDown size={12} />
                    </IconButton>
                  </>
                )}
                <IconButton size="sm" title="Remove" onClick={() => removeFile(i)}>
                  <Trash2 size={12} />
                </IconButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      {mode === 'split' && files.length > 0 && (
        <Card>
          <div style={{ display: 'grid', gap: 10 }}>
            <Field
              label="Page range (e.g., 1-3 or 1,3,5-7)"
              hint={`Total pages: ${files[0]?.pageCount || 0}`}
            >
              <Row wrap={false}>
                <Input
                  mono
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="1-3"
                />
                <Button onClick={splitPdf} disabled={processing} iconLeft={<Download size={14} />}>
                  {processing ? 'Processing...' : 'Extract pages'}
                </Button>
              </Row>
            </Field>
          </div>
        </Card>
      )}

      {mode === 'rotate' && files.length > 0 && (
        <Card>
          <div style={{ display: 'grid', gap: 12 }}>
            <Grid2>
              <Field label="Rotation angle">
                <Select
                  fullWidth
                  value={rotateAngle}
                  onChange={(e) => setRotateAngle(Number(e.target.value))}
                >
                  <option value={90}>90 degrees clockwise</option>
                  <option value={180}>180 degrees</option>
                  <option value={270}>270 degrees clockwise</option>
                </Select>
              </Field>
              <Field label="Pages">
                <Input
                  mono
                  value={rotatePages}
                  onChange={(e) => setRotatePages(e.target.value)}
                  placeholder="all or 1-3,5"
                />
              </Field>
            </Grid2>
            <Button onClick={rotatePdf} disabled={processing} iconLeft={<RotateCw size={14} />}>
              {processing ? 'Processing...' : 'Rotate & download'}
            </Button>
          </div>
        </Card>
      )}

      {mode === 'merge' && files.length >= 2 && (
        <Button onClick={mergePdfs} disabled={processing} iconLeft={<Merge size={14} />}>
          {processing ? 'Merging...' : `Merge ${files.length} PDFs`}
        </Button>
      )}

      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'hsl(var(--text-faint))' }}>
        All processing happens locally in your browser. No files are uploaded to any server.
      </p>
    </ToolPage>
  );
}
