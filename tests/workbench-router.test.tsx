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
    expect(screen.getByRole('textbox', { name: 'Paste data to find a tool' })).toBeInTheDocument();
  });

  it('shows the tools catalog with workbench and custom entries at /library', () => {
    renderAt('/library');
    expect(screen.getByRole('heading', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Full catalog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JWT Decoder/ })).toBeInTheDocument();
  });

  it('opens the JSON workspace with the formatted sample at /json-formatter', () => {
    renderAt('/json-formatter');
    expect(screen.getByRole('heading', { name: 'JSON' })).toBeInTheDocument();
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
