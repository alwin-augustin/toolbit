import { useEffect, useRef, useState } from 'react';
import { EditorState, type Extension, Facet, StateField } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  placeholder as cmPlaceholder,
  Decoration,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { tags } from '@lezer/highlight';
import { useEditorStatus } from '@/shared/workspace-store';
import { Button } from '@/components/ui/button';

export type EditorLanguage = 'json' | 'text' | 'diff';

/* Syntax palette from the design system tokens (--code-*). */
const toolbitHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'var(--code-key)' },
  { tag: tags.string, color: 'var(--code-string)' },
  { tag: tags.number, color: 'var(--code-number)' },
  { tag: [tags.keyword, tags.bool, tags.null], color: 'var(--code-keyword)' },
  { tag: [tags.punctuation, tags.separator, tags.bracket], color: 'var(--code-punc)' },
]);

/* Diff-specific line decorations — highlights lines starting with + or - */
const diffLanguage = Facet.define<boolean>();

const diffThemeExt = EditorView.theme({
  '.cm-line.diff-added': {
    backgroundColor: 'var(--code-added-bg)',
    color: 'var(--code-added)',
  },
  '.cm-line.diff-removed': {
    backgroundColor: 'var(--code-removed-bg)',
    color: 'var(--code-removed)',
  },
});

const diffLineDecoration = Decoration.line({ class: 'diff-added' });
const diffRemovedDecoration = Decoration.line({ class: 'diff-removed' });

const diffDecorationsField = StateField.define<ReturnType<typeof Decoration.set>>({
  create(state) {
    if (!state.facet(diffLanguage)) return Decoration.none;
    const widgets: Array<{ from: number; to: number; value: Decoration }> = [];
    for (let i = 1; i <= state.doc.lines; i++) {
      const line = state.doc.line(i);
      const text = line.text;
      if (text.startsWith('+')) {
        widgets.push({ from: line.from, to: line.from, value: diffLineDecoration });
      } else if (text.startsWith('-')) {
        widgets.push({ from: line.from, to: line.from, value: diffRemovedDecoration });
      }
    }
    return Decoration.set(widgets);
  },
  update(decorations, tr) {
    if (!tr.state.facet(diffLanguage)) return Decoration.none;
    decorations = decorations.map(tr.changes);
    if (!tr.docChanged) return decorations;
    const widgets: Array<{ from: number; to: number; value: Decoration }> = [];
    for (let i = 1; i <= tr.state.doc.lines; i++) {
      const line = tr.state.doc.line(i);
      const text = line.text;
      if (text.startsWith('+')) {
        widgets.push({ from: line.from, to: line.from, value: diffLineDecoration });
      } else if (text.startsWith('-')) {
        widgets.push({ from: line.from, to: line.from, value: diffRemovedDecoration });
      }
    }
    return Decoration.set(widgets);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

const toolbitTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '0.8125rem',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.625',
    padding: '10px 0',
    caretColor: 'var(--foreground)',
  },
  '.cm-line': { padding: '0 12px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: 'none',
    color: 'var(--muted-foreground)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--muted-foreground)' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
  },
  '.cm-placeholder': { color: 'var(--muted-foreground)' },
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
    if (language === 'diff') {
      extensions.push(diffLanguage.of(true), diffThemeExt, diffDecorationsField);
    }
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
        <p role="status" className="wb-preview-note px-3">
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
      <div ref={hostRef} className="flex-1 min-h-0 overflow-auto" />
    </>
  );
}
