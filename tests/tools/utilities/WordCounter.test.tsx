import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WordCounter from '@/components/tools/text/WordCounter';
function stat(label: string) {
  return screen.getByText(label).nextElementSibling;
}
describe('Word counter routed component', () => {
  it.each([
    ['Hello world test', 'Words', '3'],
    ['Hello', 'Characters', '5'],
    ['Hello World', 'Characters (no spaces)', '10'],
    ['Line 1\nLine 2\nLine 3', 'Lines', '3'],
    ['Paragraph 1\n\nParagraph 2', 'Paragraphs', '2'],
    ['First. Second! Third?', 'Sentences', '3'],
    ['', 'Words', '0'],
    ['', 'Characters', '0'],
    ['', 'Lines', '0'],
  ])('counts %s as %s = %s', (input, label, expected) => {
    render(<WordCounter />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Input' }), { target: { value: input } });
    expect(stat(label)).toHaveTextContent(expected);
  });
  it('updates live as the input changes', () => {
    render(<WordCounter />);
    const input = screen.getByRole('textbox', { name: 'Input' });
    fireEvent.change(input, { target: { value: 'One' } });
    expect(stat('Words')).toHaveTextContent('1');
    fireEvent.change(input, { target: { value: 'One Two' } });
    expect(stat('Words')).toHaveTextContent('2');
  });
});
