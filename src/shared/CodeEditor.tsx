import { useEffect, useRef, useState } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { tags } from '@lezer/highlight';
import { useEditorStatus } from '@/shared/workspace-store';
import { Button } from '@/components/ui/button';

export type EditorLanguage = 'json' | 'text';

/* Syntax palette from the design system tokens (--code-*). */
const toolbitHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'hsl(var(--code-key))' },
  { tag: tags.string, color: 'hsl(var(--code-string))' },
  { tag: tags.number, color: 'hsl(var(--code-number))' },
  { tag: [tags.keyword, tags.bool, tags.null], color: 'hsl(var(--code-keyword))' },
  { tag: [tags.punctuation, tags.separator, tags.bracket], color: 'hsl(var(--code-punc))' },
]);

const toolbitTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--text-sm)',
    backgroundColor: 'transparent',
    color: 'hsl(var(--text-strong))',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--leading-relaxed)',
    padding: '10px 0',
    caretColor: 'hsl(var(--text-strong))',
  },
  '.cm-line': { padding: '0 12px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
    color: 'hsl(var(--text-faint))',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'hsl(var(--text-muted))' },
  '.cm-cursor': { borderLeftColor: 'hsl(var(--text-strong))' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'hsl(var(--primary) / 0.25)',
  },
  '.cm-placeholder': { color: 'hsl(var(--text-faint))' },
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  /** Report caret position + byte size into the status bar. */
  reportStatus?: boolean;
  showLineNumbers?: boolean;
  label?: string;
  /** Wrap long lines. Defaults to true; large previews never wrap. */
  wrap?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language = 'text',
  readOnly = false,
  placeholder,
  reportStatus = false,
  showLineNumbers = true,
  label,
  wrap = true,
}: CodeEditorProps) {
  const rawLarge = value.length > 100 * 1024;
  // Hysteresis avoids destroying the editor when typing around the threshold:
  // lock into preview mode above 100KB, release only below 90KB.
  const [largeMode, setLargeMode] = useState(rawLarge);
  useEffect(() => {
    if (!largeMode && rawLarge) setLargeMode(true);
    else if (largeMode && value.length < 90 * 1024) setLargeMode(false);
  }, [rawLarge, value.length, largeMode]);
  const previewOnly = largeMode;
  const large = largeMode;
  const displayValue = previewOnly ? value.slice(0, 100 * 1024) : value;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const synchronizing = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const setStatus = useEditorStatus((s) => s.setStatus);

  useEffect(() => {
    if (!hostRef.current) return;

    const extensions: Extension[] = [
      EditorView.contentAttributes.of({
        'aria-label': label || (readOnly ? 'Output' : 'Input'),
        role: 'textbox',
        'aria-multiline': 'true',
      }),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      bracketMatching(),
      syntaxHighlighting(toolbitHighlight),
      toolbitTheme,
      ...(wrap && !large ? [EditorView.lineWrapping] : []),
      EditorState.readOnly.of(readOnly || previewOnly),
      EditorView.domEventHandlers({
        paste(event) {
          if (readOnly) return false;
          const text = event.clipboardData?.getData('text/plain');
          if (text !== undefined && (text.length > 100 * 1024 || previewOnly)) {
            event.preventDefault();
            onChangeRef.current?.(text);
            return true;
          }
          return false;
        },
      }),
    ];
    if (showLineNumbers) extensions.push(lineNumbers());
    if (language === 'json' && !large) extensions.push(json());
    if (placeholder) extensions.push(cmPlaceholder(placeholder));
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !synchronizing.current && !previewOnly && !readOnly) {
          onChangeRef.current?.(update.state.doc.toString());
        }
        if (reportStatus && (update.docChanged || update.selectionSet)) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          // Avoid per-keystroke Blob allocation; length is sufficient for status.
          setStatus({
            ln: line.number,
            col: pos - line.from + 1,
            bytes: update.state.doc.length,
          });
        }
      }),
    );

    const view = new EditorView({
      state: EditorState.create({ doc: displayValue, extensions }),
      parent: hostRef.current,
    });
    view.scrollDOM.tabIndex = 0;
    view.scrollDOM.setAttribute(
      'aria-label',
      `${label || (readOnly ? 'Output' : 'Input')} scroll area`,
    );
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate the editor only when structural options change.
    // displayValue is intentionally excluded: content syncs via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    language,
    readOnly,
    placeholder,
    showLineNumbers,
    reportStatus,
    label,
    large,
    previewOnly,
    wrap,
  ]);

  // Sync external value changes into the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== displayValue) {
      synchronizing.current = true;
      try {
        view.dispatch({ changes: { from: 0, to: current.length, insert: displayValue } });
      } finally {
        synchronizing.current = false;
      }
    }
  }, [displayValue]);

  return (
    <>
      {previewOnly && (
        <p role="status" style={{ padding: '0 12px' }}>
          Preview shows the first 100 KB.{' '}
          {readOnly
            ? 'Copy and pipe use the complete output.'
            : 'Processing uses the complete input. Paste to replace it, or clear to edit.'}
          {!readOnly && (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="ml-2 inline-flex"
              onClick={() => onChangeRef.current?.('')}
            >
              Clear input
            </Button>
          )}
        </p>
      )}
      <div ref={hostRef} style={{ flex: 1, minHeight: 0, overflow: 'auto' }} />
    </>
  );
}
