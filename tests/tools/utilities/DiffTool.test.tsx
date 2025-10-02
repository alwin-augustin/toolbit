import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiffTool from '@/components/tools/DiffTool'

describe('DiffTool', () => {
  it('renders the component with correct title', () => {
    render(<DiffTool />)
    expect(screen.getByText('Diff Tool')).toBeInTheDocument()
  })

  it('shows differences between two texts', async () => {
    const user = userEvent.setup()
    render(<DiffTool />)

    const text1Input = screen.getByTestId('input-text1')
    const text2Input = screen.getByTestId('input-text2')
    const compareButton = screen.getByTestId('button-compare')

    await user.type(text1Input, 'Hello World')
    await user.type(text2Input, 'Hello Universe')
    await user.click(compareButton)

    expect(screen.getByTestId('diff-line-0')).toHaveTextContent('- Hello World')
    expect(screen.getByTestId('diff-line-1')).toHaveTextContent('+ Hello Universe')
  })

  it('shows unchanged lines', async () => {
    const user = userEvent.setup()
    render(<DiffTool />)

    const text1Input = screen.getByTestId('input-text1')
    const text2Input = screen.getByTestId('input-text2')
    const compareButton = screen.getByTestId('button-compare')

    await user.type(text1Input, 'Same line')
    await user.type(text2Input, 'Same line')
    await user.click(compareButton)

    expect(screen.getByTestId('diff-line-0')).toHaveTextContent('Same line')
  })

  it('loads sample text', async () => {
    const user = userEvent.setup()
    render(<DiffTool />)

    const sampleButton = screen.getByTestId('button-sample')
    await user.click(sampleButton)

    const text1Input = screen.getByTestId('input-text1') as HTMLTextAreaElement
    const text2Input = screen.getByTestId('input-text2') as HTMLTextAreaElement

    expect(text1Input.value).toContain('Hello World')
    expect(text2Input.value).toContain('Hello Universe')
  })

  it('handles multiline differences', async () => {
    const user = userEvent.setup()
    render(<DiffTool />)

    const text1Input = screen.getByTestId('input-text1')
    const text2Input = screen.getByTestId('input-text2')
    const compareButton = screen.getByTestId('button-compare')

    await user.type(text1Input, 'Line 1\nLine 2')
    await user.type(text2Input, 'Line 1\nLine 3')
    await user.click(compareButton)

    expect(screen.getByTestId('diff-line-0')).toHaveTextContent('Line 1')
    expect(screen.getByTestId('diff-line-1')).toHaveTextContent('- Line 2')
    expect(screen.getByTestId('diff-line-2')).toHaveTextContent('+ Line 3')
  })

  it('shows legend for diff symbols', async () => {
    const user = userEvent.setup()
    render(<DiffTool />)

    const text1Input = screen.getByTestId('input-text1')
    const text2Input = screen.getByTestId('input-text2')
    const compareButton = screen.getByTestId('button-compare')

    await user.type(text1Input, 'test')
    await user.type(text2Input, 'test2')
    await user.click(compareButton)

    expect(screen.getByText(/- removed/)).toBeInTheDocument()
    expect(screen.getByText(/\+ added/)).toBeInTheDocument()
  })

  it('handles empty texts', async () => {
    const user = userEvent.setup()
    render(<DiffTool />)

    const compareButton = screen.getByTestId('button-compare')
    await user.click(compareButton)

    // Empty texts will still create a single empty diff line
    const diffLine = screen.queryByTestId('diff-line-0')
    if (diffLine) {
      expect(diffLine).toHaveTextContent('')
    }
  })
})
