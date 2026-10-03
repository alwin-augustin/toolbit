import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppRouter } from '@/app/router';
import { useWorkspace } from '@/shared/workspace-store';
import { smartPastePayload, takeSmartPaste } from '@/features/tools/specs';

beforeEach(() => {
  useWorkspace.setState({ tabs: [], activeTabId: null });
  sessionStorage.clear();
});

describe('smartPastePayload', () => {
  it('maps single-input screens to their primary field', () => {
    expect(smartPastePayload('jwt-decoder', 'a.b.c')).toEqual({ input: 'a.b.c' });
    expect(smartPastePayload('markdown-previewer', '# hi')).toEqual({ markdown: '# hi' });
    expect(smartPastePayload('diff-tool', 'old')).toEqual({ original: 'old' });
    expect(smartPastePayload('totp-generator', 'JBSW')).toEqual({ secret: 'JBSW' });
  });

  it('routes api pastes by shape', () => {
    expect(smartPastePayload('api-request-builder', 'https://api.example.com/x')).toEqual({
      url: 'https://api.example.com/x',
    });
    expect(smartPastePayload('api-request-builder', '{"a":1}')).toEqual({ body: '{"a":1}' });
  });

  it('returns null for blank text and fieldless tools', () => {
    expect(smartPastePayload('jwt-decoder', '   ')).toBeNull();
    expect(smartPastePayload('password-generator', 'abc')).toBeNull();
    expect(smartPastePayload('image-converter', 'abc')).toBeNull();
    expect(smartPastePayload('docker-command-builder', 'abc')).toBeNull();
  });
});

describe('takeSmartPaste', () => {
  it('consumes the pending paste exactly once', () => {
    sessionStorage.setItem('toolbit:smart-paste', 'hello');
    expect(takeSmartPaste()).toBe('hello');
    expect(takeSmartPaste()).toBeNull();
    sessionStorage.setItem('toolbit:smart-paste', '   ');
    expect(takeSmartPaste()).toBeNull();
  });
});

describe('router smart-paste seeding', () => {
  it('prefills a workbench tool input from the landing demo', () => {
    sessionStorage.setItem('toolbit:smart-paste', 'aGVsbG8=');
    window.history.replaceState(null, '', '/base64-encoder');
    render(<AppRouter />);
    expect(screen.getByRole('textbox', { name: 'Input code' })).toHaveValue('aGVsbG8=');
    expect(sessionStorage.getItem('toolbit:smart-paste')).toBeNull();
  });

  it('prefills a custom screen primary field from the landing demo', () => {
    sessionStorage.setItem('toolbit:smart-paste', 'unsigned.token.here');
    window.history.replaceState(null, '', '/jwt-decoder');
    render(<AppRouter />);
    expect(screen.getByRole('textbox', { name: 'JWT token' })).toHaveValue('unsigned.token.here');
  });
});
