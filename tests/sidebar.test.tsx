import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/app/shell/Sidebar';

/**
 * The Navigator is the tool tree. These assertions cover what a developer
 * relies on: every category is reachable, a category opens to reveal its
 * tools, the local filter finds a tool by name, and the panel keeps its two
 * trust/entry affordances.
 */
describe('tool navigator', () => {
  it('renders the tool tree with every category, settings and the local-only assurance', () => {
    render(<Sidebar open onNavigate={vi.fn()} />);

    expect(screen.getByRole('complementary', { name: 'Tool navigator' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Filter tools' })).toBeInTheDocument();

    // Category branches (uppercase section labels)
    expect(screen.getByText('JSON & Data')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();

    // Footer: settings entry point and the privacy promise
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Runs locally')).toBeInTheDocument();
  });

  it('reveals a category’s tools when it is expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar open onNavigate={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'JSON Formatter' })).not.toBeInTheDocument();

    await user.click(screen.getByText('JSON & Data'));

    expect(screen.getByRole('button', { name: 'JSON Formatter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JSON Validator' })).toBeInTheDocument();
  });

  it('filters the tree to matching tools', async () => {
    const user = userEvent.setup();
    render(<Sidebar open onNavigate={vi.fn()} />);

    await user.type(screen.getByRole('textbox', { name: 'Filter tools' }), 'jwt');

    expect(screen.getByRole('button', { name: 'JWT Decoder' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Word Counter' })).not.toBeInTheDocument();
  });

  it('opens a tool when it is chosen', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Sidebar open onNavigate={onNavigate} />);

    await user.click(screen.getByText('JSON & Data'));
    await user.click(screen.getByRole('button', { name: 'JSON Formatter' }));

    expect(onNavigate).toHaveBeenCalled();
  });
});
