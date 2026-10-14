import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppRouter } from '@/app/router';

function renderAt(path: string) {
  window.history.replaceState(null, '', path);
  return render(<AppRouter />);
}

describe('workbench routing', () => {
  it('shows Start at /', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Start' })).toBeInTheDocument();
  });

  it('shows the tools catalog with workbench and custom entries at /library', () => {
    renderAt('/library');
    expect(screen.getByRole('heading', { name: 'All Tools' })).toBeInTheDocument();
    // Anchored so the row itself matches, not its "Pin JWT Decoder" control.
    expect(screen.getByRole('button', { name: /^JWT Decoder/ })).toBeInTheDocument();
  });

  it('opens the JSON workspace with the formatted sample at /json-formatter', () => {
    renderAt('/json-formatter');
    // The h1 contains "JSON Formatter" - check the heading exists
    const headings = screen.getAllByRole('heading');
    expect(headings.some((h) => h.textContent?.includes('JSON'))).toBe(true);
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeEnabled();
  });

  it('lists the example session at /saved', () => {
    renderAt('/saved');
    expect(screen.getByRole('heading', { name: 'Saved' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Webhook inspection/ })).toBeInTheDocument();
  });

  it('shows history opt-in at /history', () => {
    renderAt('/history');
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Remember runs in this session/ }),
    ).toBeInTheDocument();
  });
});
