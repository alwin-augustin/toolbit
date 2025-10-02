import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlEncoder from '@/components/tools/UrlEncoder'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('UrlEncoder', () => {
  it('renders the component with correct title', () => {
    render(<UrlEncoder />)
    expect(screen.getByText('URL Encoder / Decoder')).toBeInTheDocument()
  })

  it('encodes text for URL', async () => {
    const user = userEvent.setup()
    render(<UrlEncoder />)

    const input = screen.getByTestId('input-url')
    const encodeButton = screen.getByTestId('button-encode')
    const output = screen.getByTestId('output-url')

    await user.type(input, 'Hello World!')
    await user.click(encodeButton)

    expect(output).toHaveValue('Hello%20World!')
  })

  it('decodes URL-encoded text', async () => {
    const user = userEvent.setup()
    render(<UrlEncoder />)

    const input = screen.getByTestId('input-url')
    const decodeButton = screen.getByTestId('button-decode')
    const output = screen.getByTestId('output-url')

    await user.type(input, 'Hello%20World!')
    await user.click(decodeButton)

    expect(output).toHaveValue('Hello World!')
  })

  it('encodes special characters', async () => {
    const user = userEvent.setup()
    render(<UrlEncoder />)

    const input = screen.getByTestId('input-url')
    const encodeButton = screen.getByTestId('button-encode')
    const output = screen.getByTestId('output-url')

    await user.type(input, 'email@example.com?param=value&key=test')
    await user.click(encodeButton)

    expect(output).toHaveValue('email%40example.com%3Fparam%3Dvalue%26key%3Dtest')
  })

  it('handles invalid URL encoding gracefully', async () => {
    const user = userEvent.setup()
    render(<UrlEncoder />)

    const input = screen.getByTestId('input-url')
    const decodeButton = screen.getByTestId('button-decode')
    const output = screen.getByTestId('output-url')

    await user.type(input, '%E0%A4%A')
    await user.click(decodeButton)

    expect(output.value).toContain('Error')
  })

  it('copies output to clipboard', async () => {
    const user = userEvent.setup()
    render(<UrlEncoder />)

    const input = screen.getByTestId('input-url')
    const encodeButton = screen.getByTestId('button-encode')
    const copyButton = screen.getByTestId('button-copy')

    await user.type(input, 'Test URL')
    await user.click(encodeButton)

    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('disables copy button when output is empty', async () => {
    render(<UrlEncoder />)

    const copyButton = screen.getByTestId('button-copy')
    expect(copyButton).toBeDisabled()
  })
})
