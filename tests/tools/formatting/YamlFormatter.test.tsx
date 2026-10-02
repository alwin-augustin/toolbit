import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YamlFormatter from '@/components/tools/web/YamlFormatter';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('YamlFormatter', () => {
  it('renders the component with correct title', () => {
    render(<YamlFormatter />);
    expect(screen.getByText('Input (YAML or JSON)')).toBeInTheDocument();
  });

  it('formats YAML', async () => {
    const user = userEvent.setup();
    render(<YamlFormatter />);

    const input = screen.getByRole('textbox', { name: 'Input' });
    const formatButton = screen.getByTestId('button-format-yaml');
    const output = screen.queryByRole('textbox', { name: 'Output' }) as HTMLTextAreaElement;

    await user.type(input, 'name: John\nage: 30');
    await user.click(formatButton);

    expect(output.value).toContain('name: John');
    expect(output.value).toContain('age: 30');
  });

  it('converts YAML to JSON', async () => {
    const user = userEvent.setup();
    render(<YamlFormatter />);

    const input = screen.getByRole('textbox', { name: 'Input' });
    const yamlToJsonButton = screen.getByTestId('button-yaml-to-json');
    const output = screen.queryByRole('textbox', { name: 'Output' }) as HTMLTextAreaElement;

    await user.type(input, 'name: John\nage: 30');
    await user.click(yamlToJsonButton);

    expect(output.value).toContain('"name": "John"');
    expect(output.value).toContain('"age": 30');
  });

  it('converts JSON to YAML', async () => {
    const user = userEvent.setup();
    render(<YamlFormatter />);

    const input = screen.getByRole('textbox', { name: 'Input' });
    const jsonToYamlButton = screen.getByTestId('button-json-to-yaml');
    const output = screen.queryByRole('textbox', { name: 'Output' }) as HTMLTextAreaElement;

    await user.click(input);
    await user.paste('{"name":"John","age":30}');
    await user.click(jsonToYamlButton);

    expect(output.value).toContain('name: John');
    expect(output.value).toContain('age: 30');
  });

  it('handles invalid YAML gracefully', async () => {
    const user = userEvent.setup();
    render(<YamlFormatter />);

    const input = screen.getByRole('textbox', { name: 'Input' });
    const formatButton = screen.getByTestId('button-format-yaml');
    const _output = screen.queryByRole('textbox', { name: 'Output' }) as HTMLTextAreaElement;

    await user.type(input, 'invalid:\n  - yaml\n wrong indent');
    await user.click(formatButton);

    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it('handles invalid JSON to YAML conversion', async () => {
    const user = userEvent.setup();
    render(<YamlFormatter />);

    const input = screen.getByRole('textbox', { name: 'Input' });
    const jsonToYamlButton = screen.getByTestId('button-json-to-yaml');
    const _output = screen.queryByRole('textbox', { name: 'Output' }) as HTMLTextAreaElement;

    await user.click(input);
    await user.paste('{invalid json}');
    await user.click(jsonToYamlButton);

    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it('copies output to clipboard', async () => {
    const user = userEvent.setup();
    render(<YamlFormatter />);

    const input = screen.getByRole('textbox', { name: 'Input' });
    const formatButton = screen.getByTestId('button-format-yaml');
    const copyButton = screen.getByRole('button', { name: 'Copy' });

    await user.type(input, 'test: value');
    await user.click(formatButton);

    expect(copyButton).toBeEnabled();
    await user.click(copyButton);
  });

  it('disables copy button when output is empty', () => {
    render(<YamlFormatter />);

    const copyButton = screen.getByRole('button', { name: 'Copy' });
    expect(copyButton).toBeDisabled();
  });
});
