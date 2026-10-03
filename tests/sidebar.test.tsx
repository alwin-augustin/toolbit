import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/app/shell/Sidebar';
import { useWorkspace } from '@/shared/workspace-store';

describe('workbench navigation', () => {
  it('renders the primary destinations and pinned tools', () => {
    render(<Sidebar open onNavigate={vi.fn()} />);
    for (const name of ['Start', 'Tools', 'Saved', 'History', 'Settings']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Base64' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Timestamp' })).toBeInTheDocument();
  });

  it('opens a JSON document when the JSON pin is selected', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Sidebar open onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: 'JSON' }));
    expect(useWorkspace.getState().tabs.some((t) => t.toolId === 'json-formatter')).toBe(true);
    expect(onNavigate).toHaveBeenCalled();
  });
});
