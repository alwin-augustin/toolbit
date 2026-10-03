import { useCallback, useRef, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconDeviceDesktop,
  IconDownload,
  IconPhoto,
  IconRefresh,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { useSessionDocumentState } from '@/shared/document-state';
import { downloadDataUrl } from '@/shared/tool-clipboard';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ImageOutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ImageInfo {
  name: string;
  width: number;
  height: number;
  size: number;
  type: string;
  dataUrl: string;
}

export const IMAGE_FORMAT_OPTIONS: { value: ImageOutputFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_PIXELS = 16_000_000;
const MAX_DIMENSION = 4096;

/** Same byte formatting as the legacy converter. */
export function formatImageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** JPEG has no alpha channel, so the canvas needs an opaque base. */
export function needsWhiteBackground(format: ImageOutputFormat): boolean {
  return format === 'image/jpeg';
}

/** PNG ignores quality; lossy formats map 1–100 to 0.01–1. */
export function qualityForFormat(format: ImageOutputFormat, quality: number): number | undefined {
  if (format === 'image/png') return undefined;
  return Math.max(1, Math.min(100, quality)) / 100;
}

export function outputFileName(sourceName: string, format: ImageOutputFormat): string {
  const ext = IMAGE_FORMAT_OPTIONS.find((f) => f.value === format)?.ext ?? 'png';
  const base = sourceName.replace(/\.[^.]+$/, '') || 'converted';
  return `${base}.${ext}`;
}

/** Aspect-locked height for a new width, mirroring the legacy resize behavior. */
export function heightForWidth(sourceWidth: number, sourceHeight: number, width: number): number {
  if (!sourceWidth) return 0;
  return Math.round(width * (sourceHeight / sourceWidth));
}

/** Aspect-locked width for a new height, mirroring the legacy resize behavior. */
export function widthForHeight(sourceWidth: number, sourceHeight: number, height: number): number {
  if (!sourceHeight) return 0;
  return Math.round(height * (sourceWidth / sourceHeight));
}

export function ImageScreen() {
  // Session-only: file bytes live in component state and are never persisted.
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [convertedUrl, setConvertedUrl] = useState('');
  const [convertedSize, setConvertedSize] = useState(0);
  const [outputFormat, setOutputFormat] = useSessionDocumentState<ImageOutputFormat>(
    'outputFormat',
    'image/png',
  );
  const [quality, setQuality] = useSessionDocumentState<number>('quality', 85);
  const [resizeWidth, setResizeWidth] = useSessionDocumentState<number | ''>('resizeWidth', '');
  const [resizeHeight, setResizeHeight] = useSessionDocumentState<number | ''>('resizeHeight', '');
  const [maintainAspect, setMaintainAspect] = useSessionDocumentState<boolean>(
    'maintainAspect',
    true,
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notify = useWorkbenchMemory((s) => s.notify);

  const loadImage = useCallback((file: File): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file'));
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          resolve({
            name: file.name,
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: file.size,
            type: file.type,
            dataUrl: result,
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const loaded: ImageInfo[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} is not an image.`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(`${file.name} exceeds ${formatImageSize(MAX_FILE_BYTES)}. Pick a smaller file.`);
          continue;
        }
        try {
          loaded.push(await loadImage(file));
        } catch {
          setError(`Failed to load ${file.name}.`);
        }
      }
      if (loaded.length > 0) {
        setError('');
        setImages(loaded);
        setConvertedUrl('');
        setConvertedSize(0);
        setResizeWidth(loaded[0].width);
        setResizeHeight(loaded[0].height);
      }
      e.target.value = '';
    },
    [loadImage, setResizeHeight, setResizeWidth],
  );

  const handleWidthChange = (w: number) => {
    setResizeWidth(w);
    if (maintainAspect && images.length > 0) {
      setResizeHeight(heightForWidth(images[0].width, images[0].height, w));
    }
  };

  const handleHeightChange = (h: number) => {
    setResizeHeight(h);
    if (maintainAspect && images.length > 0) {
      setResizeWidth(widthForHeight(images[0].width, images[0].height, h));
    }
  };

  const convert = useCallback(async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const img = new window.Image();
      img.src = images[0].dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load'));
      });
      const canvas = document.createElement('canvas');
      const targetW =
        typeof resizeWidth === 'number' && resizeWidth > 0 ? resizeWidth : img.naturalWidth;
      const targetH =
        typeof resizeHeight === 'number' && resizeHeight > 0 ? resizeHeight : img.naturalHeight;
      if (
        targetW > MAX_DIMENSION ||
        targetH > MAX_DIMENSION ||
        targetW * targetH > MAX_OUTPUT_PIXELS
      ) {
        setError(
          `Output too large (max ${MAX_DIMENSION}px per side, 16M pixels). Reduce resize dimensions.`,
        );
        return;
      }
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      if (needsWhiteBackground(outputFormat)) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL(outputFormat, qualityForFormat(outputFormat, quality));
      const base64Length = dataUrl.split(',')[1]?.length ?? 0;
      const outputSize = Math.ceil(base64Length * 0.75);
      setConvertedUrl(dataUrl);
      setConvertedSize(outputSize);
      const savings = ((1 - outputSize / images[0].size) * 100).toFixed(1);
      notify(
        `Converted ${formatImageSize(images[0].size)} to ${formatImageSize(outputSize)} (${Number(savings) > 0 ? `${savings}% smaller` : 'larger'})`,
      );
    } catch {
      setError('Conversion failed. The file may be corrupt or too large.');
    } finally {
      setProcessing(false);
    }
  }, [images, resizeWidth, resizeHeight, outputFormat, quality, notify]);

  const download = () => {
    if (!convertedUrl) return;
    downloadDataUrl(convertedUrl, outputFileName(images[0]?.name ?? 'converted', outputFormat));
    notify('Download started');
  };

  const clear = () => {
    setImages([]);
    setConvertedUrl('');
    setConvertedSize(0);
    setResizeWidth('');
    setResizeHeight('');
    setError('');
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Image Converter</h1>
          <p>Convert between PNG, JPEG, and WebP with resize and quality control</p>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label="Choose image file"
          className="wb-sr-only"
          onChange={(e) => void handleFileSelect(e)}
        />
        <Button
          type="button"
          className="wb-button primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <IconUpload size={22} stroke={1.7} aria-hidden="true" />
          Select image
        </Button>
        {images.length > 0 ? (
          <Button type="button" variant="outline" className="wb-button" onClick={clear}>
            <IconTrash size={22} stroke={1.7} aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {images.length > 0 ? (
        <>
          <div className="wb-setting-row">
            <span>
              <strong>Source</strong>
              <small>
                {images[0].name} · {formatImageSize(images[0].size)} · {images[0].width} x{' '}
                {images[0].height}px · {images[0].type}
              </small>
            </span>
            <img
              src={images[0].dataUrl}
              alt="Source preview"
              style={{ width: 96, height: 96, objectFit: 'contain', borderRadius: 6 }}
            />
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Output format</strong>
              <small>JPEG drops transparency; PNG keeps it but ignores quality</small>
            </span>
            <ToggleGroup
              value={[outputFormat]}
              onValueChange={(v) => setOutputFormat((v[0] ?? 'image/png') as ImageOutputFormat)}
              variant="outline"
            >
              {IMAGE_FORMAT_OPTIONS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value}>
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {outputFormat !== 'image/png' ? (
            <div className="wb-setting-row">
              <span>
                <strong>Quality: {quality}%</strong>
                <small>Lower is a smaller file; higher keeps detail</small>
              </span>
              <input
                type="range"
                aria-label="Output quality"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
              />
            </div>
          ) : null}
          <div className="wb-setting-row">
            <span>
              <strong>Resize</strong>
              <small>Large files convert slower and use more memory</small>
            </span>
            <span className="wb-row-action">
              <Input
                aria-label="Resize width"
                type="number"
                min={1}
                max={4096}
                value={resizeWidth}
                placeholder="Width"
                onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
              />
              <span aria-hidden="true">x</span>
              <Input
                aria-label="Resize height"
                type="number"
                min={1}
                max={4096}
                value={resizeHeight}
                placeholder="Height"
                onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
              />
            </span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Maintain aspect ratio</strong>
              <small>Scale the other side automatically</small>
            </span>
            <Checkbox
              aria-label="Maintain aspect ratio"
              checked={maintainAspect}
              onCheckedChange={(checked) => setMaintainAspect(Boolean(checked))}
            />
          </div>
          <div className="wb-toolbar">
            <Button
              type="button"
              className="wb-button primary"
              disabled={processing}
              onClick={() => void convert()}
            >
              <IconRefresh size={22} stroke={1.7} aria-hidden="true" />
              {processing ? 'Converting...' : 'Convert'}
            </Button>
            {convertedUrl ? (
              <Button type="button" variant="outline" className="wb-button" onClick={download}>
                <IconDownload size={22} stroke={1.7} aria-hidden="true" />
                Download ({formatImageSize(convertedSize)})
              </Button>
            ) : null}
          </div>
          {convertedUrl ? (
            <div className="wb-setting-row">
              <span>
                <strong>Result</strong>
                <small>{formatImageSize(convertedSize)}</small>
              </span>
              <img
                src={convertedUrl}
                alt="Converted preview"
                style={{ maxWidth: '100%', maxHeight: 256, objectFit: 'contain' }}
              />
            </div>
          ) : null}
        </>
      ) : (
        <div className="wb-empty">
          <IconPhoto size={32} aria-hidden="true" />
          <h2>No image yet</h2>
          <p>
            Files stay in this session and are never uploaded. JPEG output fills transparency with
            white. Very large files may be slow or fail on low-memory devices.
          </p>
        </div>
      )}
    </>
  );
}
