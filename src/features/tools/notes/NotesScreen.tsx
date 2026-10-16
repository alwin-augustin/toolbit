import { useEffect, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconDownload,
  IconEye,
  IconPencil,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { renderMarkdownToHtml, sanitizeMarkdownError } from '@/shared/markdown';
import { downloadText, useCopy } from '@/shared/tool-clipboard';
import { Button } from '@/components/ui/button';

export const NOTES_SAMPLE = `Welcome to Notes — a private scratchpad.

Nothing here is saved or sent anywhere. It stays in this tab for the session and
disappears on refresh.

## Try it

- Paste or type anything you like
- **Markdown** renders in the preview
- Toggle between editing and preview with the button above
`;

/**
 * Notes.
 *
 * The least persistent tool here: a single pane for pasting plain text, with an
 * optional sanitised Markdown preview. It owns a document like a workbench tool
 * (see DOCUMENT_BACKED_SCREENS) so its content survives moving between tools,
 * but it holds no transform and publishes nothing to history — the workspace
 * strips the payload on persist, so the note is session-only and never leaves
 * the tab.
 */
export function NotesScreen() {
  const [text, setText] = useDocumentField<string>('text', '');
  const [preview, setPreview] = useDocumentField<boolean>('preview', false);
  const [html, setHtml] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const copy = useCopy();

  useEffect(() => {
    // Only render when the preview is on; editing never pays for the render.
    if (!preview || !text.trim()) {
      setHtml('');
      return;
    }
    let cancelled = false;
    renderMarkdownToHtml(text)
      .then((rendered) => {
        if (!cancelled) setHtml(rendered);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          setHtml(sanitizeMarkdownError(message));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [preview, text, setHtml]);

  // What "Save Result…" and Copy act on: the note text itself, as Markdown.
  usePublishedResult(text.trim() ? text : '', 'Note', 'md');

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Notes</h1>
          <p>A private scratchpad — nothing leaves this tab</p>
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
        <Button
          type="button"
          className="wb-button primary"
          aria-pressed={preview}
          onClick={() => setPreview((value) => !value)}
        >
          {preview ? (
            <IconPencil size={16} stroke={1.7} aria-hidden="true" />
          ) : (
            <IconEye size={16} stroke={1.7} aria-hidden="true" />
          )}
          {preview ? 'Edit' : 'Preview'}
        </Button>
        <Button type="button" className="wb-button primary" onClick={() => setText(NOTES_SAMPLE)}>
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setText('')}
          disabled={!text}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!text.trim()}
          onClick={() => void copy(text, 'Note')}
        >
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!text.trim()}
          onClick={() => downloadText(text, 'notes.md', 'text/markdown')}
        >
          <IconDownload size={16} stroke={1.7} aria-hidden="true" />
          Download
        </Button>
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label={preview ? 'Preview panel' : 'Note panel'}>
          <div className="wb-pane-header">
            <h2>{preview ? 'Preview' : 'Note'}</h2>
          </div>
          {preview ? (
            html ? (
              <div className="wb-markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div className="wb-empty">
                <h2>No preview yet</h2>
                <p>Write or paste some Markdown to see it rendered here.</p>
              </div>
            )
          ) : (
            <CodeEditor
              value={text}
              onChange={setText}
              language="markdown"
              wrap={wrap}
              label="Note"
              placeholder="Paste or type anything..."
              showLineNumbers={false}
            />
          )}
          <div className="wb-pane-footer">
            <span>
              {preview
                ? html
                  ? `${html.length} HTML characters`
                  : 'Waiting for input'
                : `${text.length} characters`}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
