import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '@/v2/CommandPalette';

describe('overlay accessibility', () => {
  it('focuses the command palette, traps tab, and restores focus on close', async () => {
    const user = userEvent.setup();
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();

    const { rerender } = render(<CommandPalette open onClose={onClose} onSelect={vi.fn()} />);
    const input = await screen.findByRole('textbox', { name: 'Search tools' });
    await waitFor(() => expect(input).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.getByText('ESC')).toBeInTheDocument();
    expect(document.activeElement).not.toBe(input);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<CommandPalette open={false} onClose={onClose} onSelect={vi.fn()} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });
});
