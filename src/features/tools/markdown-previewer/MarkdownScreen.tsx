import { useEffect } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
} from '@tabler/icons-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';

export const MARKDOWN_SAMPLE = `# Sample Markdown

## Heading 2

This is a **bold** text and this is *italic* text.

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### List Example

- Item 1
- Item 2
  - Nested item
  - Another nested item

### Link Example

[Visit OpenAI](https://openai.com)

### Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data|
| Row 2    | Data     | More data|

> This is a blockquote
> It can span multiple lines`;

/** Render Markdown to sanitized HTML (marked + DOMPurify, as in legacy). */
export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  if (!markdown.trim()) return '';
  const rendered = await marked(markdown);
  return DOMPurify.sanitize(rendered, {
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

export function sanitizeMarkdownError(message: string): string {
  return DOMPurify.sanitize(`<p>Error rendering markdown: ${message}</p>`, {
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

export function MarkdownScreen() {
  const [markdown, setMarkdown] = useDocumentField<string>('markdown', '');
  const [html, setHtml] = useSessionDocumentState<string>('html', '');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  useEffect(() => {
    let cancelled = false;
    if (!markdown.trim()) {
      setHtml('');
      return;
    }
    renderMarkdownToHtml(markdown)
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
  }, [markdown, setHtml]);

  const copyHtml = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      notify('HTML copied');
    } catch {
      notify('Clipboard unavailable. Select the HTML and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Markdown</h1>
          <p>Preview Markdown as HTML</p>
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
          onClick={() => setMarkdown(MARKDOWN_SAMPLE)}
        >
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setMarkdown('')}
          disabled={!markdown}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => void copyHtml()}
          disabled={!html}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy HTML
        </Button>
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Markdown input panel">
          <div className="wb-pane-header">
            <h2>Markdown</h2>
          </div>
          <CodeEditor
            value={markdown}
            onChange={setMarkdown}
            wrap={wrap}
            label="Markdown input"
            placeholder="# Your markdown here..."
          />
          <div className="wb-pane-footer">
            <span>{markdown.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Preview panel">
          <div className="wb-pane-header">
            <h2>Preview</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!html}
                onClick={() => void copyHtml()}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy HTML
              </Button>
            </div>
          </div>
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="wb-empty">
              <h2>No preview yet</h2>
              <p>Write Markdown on the left to see the rendered HTML here.</p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>{html ? `${html.length} HTML characters` : 'Waiting for input'}</span>
          </div>
        </section>
      </div>
    </>
  );
}
