import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JsonFormatter from '@/components/tools/JsonFormatter'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('JsonFormatter', () => {
  it('renders the component with correct title', () => {
    render(<JsonFormatter />)
    expect(screen.getByText('JSON Formatter & Validator')).toBeInTheDocument()
  })

  it('formats minified JSON', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter />)

    const input = screen.getByTestId('input-json')
    const formatButton = screen.getByTestId('button-format')
    const output = screen.getByTestId('output-json')

    await user.click(input)
    await user.paste('{"name":"John","age":30}')
    await user.click(formatButton)

    expect(output.value).toContain('"name": "John"')
    expect(output.value).toContain('"age": 30')
  })

  it('minifies formatted JSON', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter />)

    const input = screen.getByTestId('input-json')
    const minifyButton = screen.getByTestId('button-minify')
    const output = screen.getByTestId('output-json')

    const formattedJson = `{
  "name": "John",
  "age": 30
}`
    await user.click(input)
    await user.paste(formattedJson)
    await user.click(minifyButton)

    expect(output).toHaveValue('{"name":"John","age":30}')
  })

  it('handles invalid JSON gracefully', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter />)

    const input = screen.getByTestId('input-json')
    const formatButton = screen.getByTestId('button-format')
    const output = screen.getByTestId('output-json')

    await user.click(input)
    await user.paste('{invalid json}')
    await user.click(formatButton)

    expect(output.value).toContain('Error')
  })

  it('formats nested JSON objects', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter />)

    const input = screen.getByTestId('input-json')
    const formatButton = screen.getByTestId('button-format')
    const output = screen.getByTestId('output-json')

    await user.click(input)
    await user.paste('{"user":{"name":"John","address":{"city":"NYC"}}}')
    await user.click(formatButton)

    expect(output.value).toContain('"user":')
    expect(output.value).toContain('"address":')
  })

  it('copies output to clipboard', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter />)

    const input = screen.getByTestId('input-json')
    const formatButton = screen.getByTestId('button-format')
    const copyButton = screen.getByTestId('button-copy')

    await user.click(input)
    await user.paste('{"test":"value"}')
    await user.click(formatButton)

    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('disables copy button when output is empty', () => {
    render(<JsonFormatter />)

    const copyButton = screen.getByTestId('button-copy')
    expect(copyButton).toBeDisabled()
  })
})
