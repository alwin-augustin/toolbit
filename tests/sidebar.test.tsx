import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/v2/Sidebar';

describe('workspace navigation', () => {
  it('opens the configured preset when a workspace row is selected', async () => {
    const user = userEvent.setup();
    const onWorkflow = vi.fn();

    render(
      <Sidebar
        activeToolId={null}
        activeCategory={null}
        onTool={vi.fn()}
        onCategory={vi.fn()}
        onSearch={vi.fn()}
        onHistory={vi.fn()}
        onWorkspaces={vi.fn()}
        onSnippets={vi.fn()}
        onFavorites={vi.fn()}
        onWorkflow={onWorkflow}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'API Debug' }));
    expect(onWorkflow).toHaveBeenCalledWith('api-debug');
  });
});
