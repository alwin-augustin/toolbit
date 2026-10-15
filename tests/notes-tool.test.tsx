import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentContext } from '@/shared/document-state';
import { useWorkspace } from '@/shared/workspace-store';
import { DOCUMENT_BACKED_SCREENS, isWorkbenchToolId } from '@/features/tools/specs';
import { isCustomToolId } from '@/features/tools/custom-screens';
import { TOOLS } from '@/content/tools.config';
import { NotesScreen } from '@/features/tools/notes/NotesScreen';
import { renderMarkdownToHtml } from '@/shared/markdown';

/** Mount Notes with a backing document, the way the router does. */
function mountNotes(): string | null {
  const docId = useWorkspace.getState().openDocument('notes');
  render(
    <DocumentContext.Provider value={docId ?? null}>
      <NotesScreen />
    </DocumentContext.Provider>,
  );
  return docId;
}

describe('Notes screen', () => {
  beforeEach(() => {
    useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  });

  it('renders the heading, an editor and the primary controls', () => {
    mountNotes();
    expect(screen.getByRole('heading', { level: 1, name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Note' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load sample/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
  });

  it('keeps typed text in the document payload and clears it', async () => {
    const user = userEvent.setup();
    const docId = mountNotes();
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'hello note');
    expect(useWorkspace.getState().tabs.find((t) => t.id === docId)?.payload?.text).toBe(
      'hello note',
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect((screen.getByRole('textbox', { name: 'Note' }) as HTMLTextAreaElement).value).toBe('');
  });

  it('toggles between editing and a rendered, sanitised preview', async () => {
    const user = userEvent.setup();
    const docId = mountNotes();
    useWorkspace.getState().patchDocument(docId!, {
      payload: { text: '# Hello\n\n**bold** and <script>alert(1)</script>' },
    });

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    await waitFor(() => expect(screen.getByText('Hello', { selector: 'h1' })).toBeInTheDocument());
    expect(screen.getByText('bold')).toBeInTheDocument();
    // The script tag is stripped, not executed or rendered as markup.
    expect(document.querySelector('.wb-markdown-preview script')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('textbox', { name: 'Note' })).toBeInTheDocument();
  });

  it('never emits executable HTML from pasted Markdown', async () => {
    const html = await renderMarkdownToHtml('hello<script>alert(1)</script>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
  });
});

describe('documents are never persisted for a private tool', () => {
  it('notes is classified as a secret tool', async () => {
    const { getToolPolicy, canPersistTool, canShareTool } = await import('@/core/tool-policy');
    expect(getToolPolicy('notes').sensitivity).toBe('secret');
    expect(canPersistTool('notes')).toBe(false);
    expect(canShareTool('notes')).toBe(false);
  });

  it('every document-backed screen is a registered, non-workbench custom screen', () => {
    for (const id of DOCUMENT_BACKED_SCREENS) {
      expect(
        TOOLS.some((tool) => tool.id === id),
        `${id} is not in the catalogue`,
      ).toBe(true);
      expect(isCustomToolId(id), `${id} is not a registered custom screen`).toBe(true);
      expect(isWorkbenchToolId(id), `${id} must not be a workbench tool`).toBe(false);
    }
  });
});
