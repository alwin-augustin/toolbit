import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HashGenerator from '@/components/tools/HashGenerator'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock crypto.subtle.digest
const mockDigest = vi.fn()

describe('HashGenerator', () => {
  beforeEach(() => {
    mockDigest.mockImplementation((_algorithm: string) => {
      const mockHash = new Uint8Array([1, 2, 3, 4]).buffer
      return Promise.resolve(mockHash)
    })

    // Mock crypto.subtle
    Object.defineProperty(global.crypto, 'subtle', {
      value: {
        digest: mockDigest,
      },
      writable: true,
      configurable: true,
    })
  })

  it('renders the component with correct title', () => {
    render(<HashGenerator />)
    expect(screen.getByText('Hash Generator')).toBeInTheDocument()
  })

  it('generates hashes for input text', async () => {
    const user = userEvent.setup()
    render(<HashGenerator />)

    const input = screen.getByTestId('input-hash')
    const generateButton = screen.getByTestId('button-generate')

    await user.type(input, 'test text')
    await user.click(generateButton)

    expect(screen.getByTestId('output-md5')).toBeInTheDocument()
    expect(screen.getByTestId('output-sha1')).toBeInTheDocument()
    expect(screen.getByTestId('output-sha256')).toBeInTheDocument()
    expect(screen.getByTestId('output-sha512')).toBeInTheDocument()
  })

  it('displays all hash types', async () => {
    const user = userEvent.setup()
    render(<HashGenerator />)

    const input = screen.getByTestId('input-hash')
    const generateButton = screen.getByTestId('button-generate')

    await user.type(input, 'test')
    await user.click(generateButton)

    expect(screen.getByText('MD5')).toBeInTheDocument()
    expect(screen.getByText('SHA-1')).toBeInTheDocument()
    expect(screen.getByText('SHA-256')).toBeInTheDocument()
    expect(screen.getByText('SHA-512')).toBeInTheDocument()
  })

  it('copies MD5 hash to clipboard', async () => {
    const user = userEvent.setup()
    render(<HashGenerator />)

    const input = screen.getByTestId('input-hash')
    const generateButton = screen.getByTestId('button-generate')

    await user.type(input, 'test')
    await user.click(generateButton)

    const copyButton = screen.getByTestId('button-copy-md5')
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('copies SHA-256 hash to clipboard', async () => {
    const user = userEvent.setup()
    render(<HashGenerator />)

    const input = screen.getByTestId('input-hash')
    const generateButton = screen.getByTestId('button-generate')

    await user.type(input, 'test')
    await user.click(generateButton)

    const copyButton = screen.getByTestId('button-copy-sha256')
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('does not generate hashes for empty input', async () => {
    const user = userEvent.setup()
    render(<HashGenerator />)

    const generateButton = screen.getByTestId('button-generate')
    await user.click(generateButton)

    expect(screen.queryByTestId('output-md5')).not.toBeInTheDocument()
  })

  it('generates hexadecimal hash output', async () => {
    const user = userEvent.setup()
    render(<HashGenerator />)

    const input = screen.getByTestId('input-hash')
    const generateButton = screen.getByTestId('button-generate')

    await user.type(input, 'test')
    await user.click(generateButton)

    const sha256Output = screen.getByTestId('output-sha256') as HTMLInputElement
    // Check if output is hexadecimal (should be '01020304' from mock)
    expect(sha256Output.value).toMatch(/^[0-9a-f]+$/)
  })
})
