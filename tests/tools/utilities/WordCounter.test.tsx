import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WordCounter from '@/components/tools/WordCounter'

describe('WordCounter', () => {
  it('renders the component with correct title', () => {
    render(<WordCounter />)
    expect(screen.getByText('Word Counter')).toBeInTheDocument()
  })

  it('counts words correctly', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    await user.type(input, 'Hello world test')

    const wordCount = screen.getByTestId('count-words')
    expect(wordCount).toHaveTextContent('3')
  })

  it('counts characters correctly', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    await user.type(input, 'Hello')

    const charCount = screen.getByTestId('count-characters')
    expect(charCount).toHaveTextContent('5')
  })

  it('counts characters without spaces', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    await user.type(input, 'Hello World')

    const charNoSpacesCount = screen.getByTestId('count-characters-no-spaces')
    expect(charNoSpacesCount).toHaveTextContent('10')
  })

  it('counts lines correctly', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    await user.type(input, 'Line 1\nLine 2\nLine 3')

    const lineCount = screen.getByTestId('count-lines')
    expect(lineCount).toHaveTextContent('3')
  })

  it('counts paragraphs correctly', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    await user.type(input, 'Paragraph 1\n\nParagraph 2')

    const paragraphCount = screen.getByTestId('count-paragraphs')
    expect(paragraphCount).toHaveTextContent('2')
  })

  it('counts sentences correctly', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    await user.type(input, 'First sentence. Second sentence! Third sentence?')

    const sentenceCount = screen.getByTestId('count-sentences')
    expect(sentenceCount).toHaveTextContent('3')
  })

  it('shows zero counts for empty text', () => {
    render(<WordCounter />)

    expect(screen.getByTestId('count-words')).toHaveTextContent('0')
    expect(screen.getByTestId('count-characters')).toHaveTextContent('0')
    expect(screen.getByTestId('count-characters-no-spaces')).toHaveTextContent('0')
  })

  it('updates counts in real-time', async () => {
    const user = userEvent.setup()
    render(<WordCounter />)

    const input = screen.getByTestId('input-text')
    const wordCount = screen.getByTestId('count-words')

    await user.type(input, 'One')
    expect(wordCount).toHaveTextContent('1')

    await user.type(input, ' Two')
    expect(wordCount).toHaveTextContent('2')
  })
})
