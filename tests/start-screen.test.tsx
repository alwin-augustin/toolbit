import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { useState } from 'react';
import { StartScreen } from '@/app/screens/StartScreen';
import { AppRouter } from '@/app/router';
import { useWorkspace } from '@/shared/workspace-store';

beforeEach(() => {
  useWorkspace.setState({ tabs: [], activeTabId: null, closed: [] });
  sessionStorage.clear();
});

/** StartScreen needs a router to navigate; this one records pushes. */
function renderStart(pushes: string[] = []) {
  function Shell() {
    const [path, setPath] = useState('/');
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
        <StartScreen />
      </Router>
    );
  }
  return render(<Shell />);
}

describe('start screen', () => {
  it('leads with a paste field and a search affordance', () => {
    renderStart();
    expect(screen.getByRole('heading', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Paste data to find a tool' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search tools or actions/ })).toBeInTheDocument();
  });

  it('recognises pasted JSON and opens the formatter carrying the payload', async () => {
    const user = userEvent.setup();
    const pushes: string[] = [];
    renderStart(pushes);

    await user.click(screen.getByRole('textbox', { name: 'Paste data to find a tool' }));
    await user.paste('{"b":2,"a":1}');

    const suggestion = await screen.findByRole('button', { name: /Open JSON Formatter/ });
    await user.click(suggestion);

    expect(pushes).toContain('/json-formatter');
    const tab = useWorkspace.getState().tabs.find((t) => t.toolId === 'json-formatter');
    expect(tab?.payload).toMatchObject({ input: '{"b":2,"a":1}' });
  });

  it('carries a paste for a custom screen through the pending-paste channel', async () => {
    const user = userEvent.setup();
    renderStart();

    await user.click(screen.getByRole('textbox', { name: 'Paste data to find a tool' }));
    await user.paste('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig');

    const suggestion = await screen.findByRole('button', { name: /Open JWT Decoder/ });
    await user.click(suggestion);

    expect(sessionStorage.getItem('toolbit:smart-paste')).toBe(
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig',
    );
  });
});

describe('custom tool routes', () => {
  it('renders the tool instead of redirecting to the start screen', () => {
    window.history.replaceState(null, '', '/jwt-decoder');
    render(<AppRouter />);

    // Before the fix this route bounced to '/' and showed Start.
    expect(window.location.pathname).toBe('/jwt-decoder');
    expect(screen.queryByRole('heading', { name: 'Start' })).not.toBeInTheDocument();
  });
});
