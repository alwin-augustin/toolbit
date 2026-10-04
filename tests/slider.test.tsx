import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Slider } from '@/components/ui/slider';

describe('Slider UI primitive', () => {
  it('renders slider with default props', () => {
    render(<Slider aria-label="Volume" defaultValue={50} />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('value', '50');
  });

  it('renders disabled slider', () => {
    render(<Slider aria-label="Quality" value={80} disabled />);
    const slider = screen.getByRole('slider', { name: 'Quality' });
    expect(slider).toBeDisabled();
  });

  it('handles min, max, step, and custom values', () => {
    const handleChange = vi.fn();
    render(
      <Slider
        aria-label="Range"
        value={30}
        min={10}
        max={100}
        step={5}
        onValueChange={handleChange}
      />,
    );
    const slider = screen.getByRole('slider', { name: 'Range' });
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '5');
    expect(slider).toHaveAttribute('value', '30');
  });

  it('supports array values', () => {
    render(<Slider aria-label="ArrayValue" value={[42]} />);
    const slider = screen.getByRole('slider', { name: 'ArrayValue' });
    expect(slider).toHaveAttribute('value', '42');
  });
});
