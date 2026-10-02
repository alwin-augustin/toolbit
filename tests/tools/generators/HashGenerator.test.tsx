import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HashGenerator from '@/components/tools/security/HashGenerator';
describe('Hash generator routed component', () => {
  it('computes actual hexadecimal digests automatically', async () => {
    render(<HashGenerator />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Input' }), { target: { value: 'test' } });
    await waitFor(() =>
      expect(screen.getByTestId('output-md5')).toHaveValue('098f6bcd4621d373cade4e832627b4f6'),
    );
    expect(screen.getByTestId('output-sha256')).toHaveValue(
      '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    );
    for (const name of ['sha1', 'sha512'])
      expect((screen.getByTestId(`output-${name}`) as HTMLInputElement).value).toMatch(
        /^[0-9a-f]+$/,
      );
    expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(5);
  });
  it('does not generate a digest for empty input', () => {
    render(<HashGenerator />);
    expect(screen.queryByTestId('output-md5')).not.toBeInTheDocument();
  });
});
