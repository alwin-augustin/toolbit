import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CssFormatter from '@/components/tools/CssFormatter'

describe('CssFormatter', () => {
  it('renders the component', () => {
    render(<CssFormatter />)
    expect(screen.getByText('CSS')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
  })

  it('formats CSS', async () => {
    const user = userEvent.setup()
    render(<CssFormatter />)

    const input = screen.getByPlaceholderText('Enter CSS data')
    const formatButton = screen.getByRole('button', { name: /format/i })
    const output = screen.getByPlaceholderText('Formatted/Minified CSS output')

    await user.click(input)
    await user.paste('.test{color:red;}')
    await user.click(formatButton)

    expect(output.value).toContain('.test')
    expect(output.value).toContain('color')
  })

  it('minifies CSS', async () => {
    const user = userEvent.setup()
    render(<CssFormatter />)

    const input = screen.getByPlaceholderText('Enter CSS data')
    const minifyButton = screen.getByRole('button', { name: /minify/i })
    const output = screen.getByPlaceholderText('Formatted/Minified CSS output')

    const cssInput = `.test {
  color: red;
}`
    await user.click(input)
    await user.paste(cssInput)
    await user.click(minifyButton)

    expect(output.value).toContain('.test')
    expect(output.value).toContain('color')
  })

  it('handles invalid CSS', async () => {
    const user = userEvent.setup()
    render(<CssFormatter />)

    const input = screen.getByPlaceholderText('Enter CSS data')
    const formatButton = screen.getByRole('button', { name: /format/i })
    const output = screen.getByPlaceholderText('Formatted/Minified CSS output')

    await user.click(input)
    await user.paste('totally invalid css without braces')
    await user.click(formatButton)

    // Should still process or show some output
    expect(output.value).toBeTruthy()
  })

  it('formats multi-rule CSS', async () => {
    const user = userEvent.setup()
    render(<CssFormatter />)

    const input = screen.getByPlaceholderText('Enter CSS data')
    const formatButton = screen.getByRole('button', { name: /format/i })
    const output = screen.getByPlaceholderText('Formatted/Minified CSS output')

    await user.click(input)
    await user.paste('.a{color:red;}.b{color:blue;}')
    await user.click(formatButton)

    expect(output.value).toContain('.a')
    expect(output.value).toContain('.b')
  })
})
