import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Base64Encoder from '@/components/tools/Base64Encoder'

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('Base64Encoder', () => {
  it('renders the component with correct title', () => {
    render(<Base64Encoder />)
    expect(screen.getByText('Base64 Encoder / Decoder')).toBeInTheDocument()
  })

  it('encodes text to base64', async () => {
    const user = userEvent.setup()
    render(<Base64Encoder />)

    const input = screen.getByTestId('input-base64')
    const encodeButton = screen.getByTestId('button-encode')
    const output = screen.getByTestId('output-base64')

    await user.type(input, 'Hello World')
    await user.click(encodeButton)

    expect(output).toHaveValue('SGVsbG8gV29ybGQ=')
  })

  it('decodes base64 to text', async () => {
    const user = userEvent.setup()
    render(<Base64Encoder />)

    const input = screen.getByTestId('input-base64')
    const decodeButton = screen.getByTestId('button-decode')
    const output = screen.getByTestId('output-base64')

    await user.type(input, 'SGVsbG8gV29ybGQ=')
    await user.click(decodeButton)

    expect(output).toHaveValue('Hello World')
  })

  it('handles encoding special characters', async () => {
    const user = userEvent.setup()
    render(<Base64Encoder />)

    const input = screen.getByTestId('input-base64')
    const encodeButton = screen.getByTestId('button-encode')
    const output = screen.getByTestId('output-base64')

    await user.type(input, '!@#$%^&*()')
    await user.click(encodeButton)

    expect(output).toHaveValue('IUAjJCVeJiooKQ==')
  })

  it('handles invalid base64 decode gracefully', async () => {
    const user = userEvent.setup()
    render(<Base64Encoder />)

    const input = screen.getByTestId('input-base64')
    const decodeButton = screen.getByTestId('button-decode')
    const output = screen.getByTestId('output-base64')

    await user.type(input, 'Invalid Base64!')
    await user.click(decodeButton)

    expect(output.value).toContain('Error')
  })

  it('enables copy button when output has content', async () => {
    const user = userEvent.setup()
    render(<Base64Encoder />)

    const input = screen.getByTestId('input-base64')
    const encodeButton = screen.getByTestId('button-encode')
    const copyButton = screen.getByTestId('button-copy')

    expect(copyButton).toBeDisabled()

    await user.type(input, 'Test')
    await user.click(encodeButton)

    expect(copyButton).toBeEnabled()
  })

  it('copies output to clipboard', async () => {
    const user = userEvent.setup()
    render(<Base64Encoder />)

    const input = screen.getByTestId('input-base64')
    const encodeButton = screen.getByTestId('button-encode')
    const copyButton = screen.getByTestId('button-copy')

    await user.type(input, 'Test')
    await user.click(encodeButton)

    // Copy button should be enabled and clickable
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })
})
