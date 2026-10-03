import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchDialog } from '@/app/shell/SearchDialog';
import { useWorkspace } from '@/shared/workspace-store';

describe('search dialog accessibility', () => {
  it('focuses search on open and opens the first matching tool on Enter', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SearchDialog onClose={onClose} />);

    const input = screen.getByRole('textbox', { name: 'Search tools and saved work' });
    await waitFor(() => expect(input).toHaveFocus());

    await user.type(input, 'timestamp');
    expect(screen.getByRole('button', { name: /Timestamp Converter/ })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalled();
    expect(useWorkspace.getState().tabs.some((t) => t.toolId === 'timestamp-converter')).toBe(true);
  });
});
