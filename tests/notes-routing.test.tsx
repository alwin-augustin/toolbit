import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppRouter } from '@/app/router';
import { useWorkspace } from '@/shared/workspace-store';

/**
 * Notes is a custom screen that owns a document (DOCUMENT_BACKED_SCREENS), so it
 * should open a Tab on direct navigation the way a workbench tool does — that is
 * what keeps its content alive while you move between tools in the session.
 */
describe('Notes routing', () => {
  beforeEach(() => {
    useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
    document.body.innerHTML = '';
  });

  it('opens a document (Tab) when you navigate to /notes', async () => {
    window.history.replaceState(null, '', '/notes');
    render(<AppRouter />);

    await screen.findByRole('heading', { level: 1, name: 'Notes' });
    await waitFor(() =>
      expect(useWorkspace.getState().tabs.some((t) => t.toolId === 'notes')).toBe(true),
    );
  });
});
