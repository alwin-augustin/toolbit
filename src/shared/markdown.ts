import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Markdown rendering shared by the Markdown Previewer and the Notes screen.
 *
 * Both tools render user-pasted Markdown to HTML, so the sanitiser config lives
 * here once rather than drifting between two copies of the same rules.
 */

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
