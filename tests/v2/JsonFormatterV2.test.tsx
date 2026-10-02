import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const history = vi.hoisted(() => ({ addEntry: vi.fn() }));
vi.mock('@/hooks/use-tool-history', () => ({ useToolHistory: () => history }));
vi.mock('@/v2/Inspector', () => ({ registerInspectorPanel: vi.fn() }));
vi.mock('@/v2/smart-paste', () => ({ useSmartPasteInput: vi.fn() }));
vi.mock('@/v2/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    readOnly,
  }: {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
  }) => (
    <textarea
      aria-label={readOnly ? 'JSON output' : 'JSON input'}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));
vi.mock('@/v2/EditorPanels', () => ({
  EditorSplit: ({ children, output }: { children: React.ReactNode; output: string }) => (
    <div>
      <output data-testid="pipe-output">{output}</output>
      {children}
    </div>
  ),
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PanelHeader: ({ action }: { action: React.ReactNode }) => <div>{action}</div>,
  CopyAction: ({ text }: { text: string }) => <output data-testid="copy-output">{text}</output>,
  ValidityBadge: () => null,
}));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  history.addEntry.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('canonical JSON output with legacy collapse preferences', () => {
  for (const length of [20, 21, 1000]) {
    for (const indent of [2, 4, 8]) {
      it(`preserves ${length} nested items with ${indent}-space indentation`, async () => {
        localStorage.setItem(
          'toolbit-v2-json-options',
          JSON.stringify({
            state: { indent, sortKeys: true, validateWhileTyping: true, collapseArrays: true },
            version: 0,
          }),
        );
        const { default: JsonFormatterV2 } = await import('@/v2/tools/JsonFormatterV2');
        render(<JsonFormatterV2 />);
        const input = JSON.stringify({
          z: Array.from({ length }, (_, i) => ({ z: i, a: [i, i + 1] })),
          a: 'canary',
        });
        const expected = JSON.stringify(
          { a: 'canary', z: Array.from({ length }, (_, i) => ({ a: [i, i + 1], z: i })) },
          null,
          indent,
        );
        fireEvent.change(screen.getByRole('textbox', { name: 'JSON input' }), {
          target: { value: input },
        });
        expect(screen.getByRole('textbox', { name: 'JSON output' })).toHaveValue(expected);
        expect(screen.getByTestId('copy-output').textContent).toBe(expected);
        expect(screen.getByTestId('pipe-output').textContent).toBe(expected);
        vi.advanceTimersByTime(1500);
        expect(history.addEntry).toHaveBeenCalledWith({ input, output: expected });
      });
    }
  }
});
