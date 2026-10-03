import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppRouter } from '@/app/router';
import { TOOLS } from '@/content/tools.config';

function renderAt(path: string) {
  window.history.replaceState(null, '', path);
  return render(<AppRouter />);
}

/**
 * Phase 2 — router matrix over all 42 tool routes.
 * Extends workbench-router.test.tsx (5 routes) to full catalog.
 */
describe('router matrix (all tools)', () => {
  it('renders an h1 for every catalog tool without crashing', async () => {
    for (const tool of TOOLS) {
      document.body.innerHTML = '';
      window.history.replaceState(null, '', tool.path);
      const { unmount } = render(<AppRouter />);
      expect(
        await screen.findByRole('heading', { level: 1 }, { timeout: 3000 }),
        `missing h1 for ${tool.id}`,
      ).toBeInTheDocument();
      unmount();
      document.body.innerHTML = '';
    }
  });

  it('serves every tool from the root with no /app prefix', () => {
    for (const tool of TOOLS) expect(tool.path).toBe(`/${tool.id}`);
  });

  it('shows Start at /', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Start' })).toBeInTheDocument();
  });
});
