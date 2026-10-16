import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { useState } from 'react';
import { NextActions } from '@/app/components/NextActions';
import { AppRouter } from '@/app/router';
import { useWorkspace } from '@/shared/workspace-store';

beforeEach(() => {
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  sessionStorage.clear();
  vi.clearAllMocks();
});

/** NextActions needs a router to navigate; this one records pushes. */
function renderNextActions(toolId: string, payload: string, pushes: string[] = []) {
  function Shell() {
    const [path, setPath] = useState('/from');
    return (
      <Router
        hook={() => [
          path,
          (to: string) => {
            pushes.push(to);
            setPath(to);
          },
        ]}
      >
        <NextActions toolId={toolId} payload={payload} />
      </Router>
    );
  }
  return render(<Shell />);
}

describe('next useful actions', () => {
  it('offers at most two follow-ups, each naming the operation it performs', () => {
    renderNextActions('json-formatter', '{"a":1}');

    const strip = screen.getByRole('region', { name: 'Next useful actions' });
    expect(strip).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate json against a schema' })).toHaveAttribute(
      'title',
      'Open JSON Validator',
    );
    expect(screen.getByRole('button', { name: 'Compare two texts' })).toBeInTheDocument();
    // `related` is ordered and capped: the third edge stays out.
    expect(screen.queryByRole('button', { name: 'Format yaml' })).not.toBeInTheDocument();
  });

  it('renders nothing without a payload or without a handoff edge', () => {
    const { unmount } = renderNextActions('json-formatter', '   ');
    expect(screen.queryByRole('region', { name: 'Next useful actions' })).not.toBeInTheDocument();
    unmount();

    renderNextActions('hash-generator', 'abc123');
    expect(screen.queryByRole('region', { name: 'Next useful actions' })).not.toBeInTheDocument();
  });

  it('stages a custom-screen handoff and reports it', async () => {
    const user = userEvent.setup();
    const pushes: string[] = [];
    renderNextActions('json-formatter', '{"a":1}', pushes);

    await user.click(screen.getByRole('button', { name: 'Validate json against a schema' }));

    expect(pushes).toContain('/json-validator');
    expect(sessionStorage.getItem('toolbit:smart-paste')).toBe('{"a":1}');
  });

  it('opens a workbench handoff as a new document seeded with the payload', async () => {
    const user = userEvent.setup();
    const pushes: string[] = [];
    renderNextActions('jwt-decoder', '{"sub":"1"}', pushes);

    await user.click(screen.getByRole('button', { name: 'Convert a unix timestamp to a date' }));

    expect(pushes).toContain('/timestamp-converter');
    const tab = useWorkspace.getState().tabs.find((t) => t.toolId === 'timestamp-converter');
    expect(tab?.payload).toMatchObject({ input: '{"sub":"1"}' });
  });
});

describe('next useful actions in the result chrome', () => {
  it('appears after a successful run and hands the result to the next tool', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/json-formatter');
    render(<AppRouter />);

    // The default invoice document already holds a valid result.
    const strip = await screen.findByRole('region', { name: 'Next useful actions' });
    await user.click(within(strip).getByRole('button', { name: 'Validate json against a schema' }));

    // The validator opens with the result carried into its data field.
    await waitFor(() => expect(window.location.pathname).toBe('/json-validator'));
    expect(await screen.findByRole('textbox', { name: 'JSON data' })).toHaveTextContent('inv_1042');
  });
});
