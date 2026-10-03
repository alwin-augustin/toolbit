import { describe, expect, it } from 'vitest';
import { convertUnitValue } from '@/features/tools/unit-converter/UnitScreen';
import { renderMarkdownToHtml } from '@/features/tools/markdown-previewer/MarkdownScreen';
import { generatePasswords } from '@/features/tools/password-generator/PasswordScreen';

/**
 * Phase 1 — missing golden vectors: unit categories, markdown XSS, seeded determinism.
 */
describe('unit converter categories', () => {
  it('converts mass', () => {
    expect(convertUnitValue(1, 'kg', 'g')).toBeCloseTo(1000, 5);
    expect(convertUnitValue(1, 'lb', 'kg')).toBeCloseTo(0.45359237, 5);
  });

  it('converts volume', () => {
    expect(convertUnitValue(1, 'l', 'ml')).toBeCloseTo(1000, 5);
    expect(convertUnitValue(1, 'gal', 'l')).toBeCloseTo(3.785411784, 3);
  });

  it('converts time', () => {
    expect(convertUnitValue(1, 'h', 'min')).toBeCloseTo(60, 5);
    expect(convertUnitValue(1, 'd', 'h')).toBeCloseTo(24, 5);
  });

  it('throws for incompatible units instead of returning a wrong number', () => {
    expect(() => convertUnitValue(1, 'kg', 'm')).toThrow();
  });
});

describe('markdown XSS boundary', () => {
  it.each([
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '[x](javascript:alert(1))',
    'hello<script>alert(1)</script>',
    '<iframe src="https://evil.invalid">',
  ])('sanitizes %s', async (input) => {
    const html = await renderMarkdownToHtml(input);
    expect(html).not.toMatch(/<script|onerror|onload|javascript:|iframe/i);
  });

  it('keeps legitimate formatting', async () => {
    const html = await renderMarkdownToHtml('# Hi\n\n**bold**');
    expect(html).toContain('<h1');
    expect(html).toContain('<strong>bold</strong>');
  });
});

describe('seeded determinism', () => {
  it('replays passwords for the same entropy source', () => {
    const src = (n: number) => Uint32Array.from({ length: n }, (_, i) => i);
    expect(generatePasswords('ab', 4, 2, src)).toEqual(generatePasswords('ab', 4, 2, src));
  });
});

describe('shared dialog and utils', () => {
  it('handles openDialog and closeDialog with showModal/close and fallbacks', async () => {
    const { openDialog, closeDialog } = await import('@/shared/dialog');
    const { cn } = await import('@/lib/utils');

    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');

    openDialog(null);
    closeDialog(null);

    const dialog = document.createElement('dialog');
    let showModalCalled = false;
    let closeCalled = false;
    dialog.showModal = () => {
      showModalCalled = true;
      dialog.open = true;
    };
    dialog.close = () => {
      closeCalled = true;
      dialog.open = false;
    };

    openDialog(dialog);
    expect(showModalCalled).toBe(true);
    expect(dialog.open).toBe(true);

    // already open, no-op
    openDialog(dialog);

    closeDialog(dialog);
    expect(closeCalled).toBe(true);
    expect(dialog.open).toBe(false);

    // already closed, no-op
    closeDialog(dialog);

    // Fallback branch without showModal/close
    const fallbackDialog = document.createElement('dialog');
    Object.defineProperty(fallbackDialog, 'showModal', { value: undefined });
    Object.defineProperty(fallbackDialog, 'close', { value: undefined });

    openDialog(fallbackDialog);
    expect(fallbackDialog.hasAttribute('open')).toBe(true);

    closeDialog(fallbackDialog);
    expect(fallbackDialog.hasAttribute('open')).toBe(false);
  });
});
