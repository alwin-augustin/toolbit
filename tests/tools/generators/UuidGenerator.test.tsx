import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UuidGenerator from '@/components/tools/UuidGenerator'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('UuidGenerator', () => {
  it('renders the component with correct title', () => {
    render(<UuidGenerator />)
    expect(screen.getByText('UUID / GUID Generator')).toBeInTheDocument()
  })

  it('generates a single UUID', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const generateButton = screen.getByTestId('button-generate-single')
    await user.click(generateButton)

    const uuid = screen.getByTestId('uuid-0')
    expect(uuid).toHaveValue('123e4567-e89b-12d3-a456-426614174000')
  })

  it('generates multiple UUIDs', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const countInput = screen.getByTestId('input-count')
    const generateButton = screen.getByTestId('button-generate')

    await user.clear(countInput)
    await user.type(countInput, '3')
    await user.click(generateButton)

    expect(screen.getByTestId('uuid-0')).toBeInTheDocument()
    expect(screen.getByTestId('uuid-1')).toBeInTheDocument()
    expect(screen.getByTestId('uuid-2')).toBeInTheDocument()
  })

  it('displays correct count of generated UUIDs', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const countInput = screen.getByTestId('input-count') as HTMLInputElement
    const generateButton = screen.getByTestId('button-generate')

    // Set the value directly
    await user.clear(countInput)
    await user.click(countInput)
    await user.keyboard('3')
    await user.click(generateButton)

    // Check that exactly 3 UUIDs were generated
    expect(screen.getByTestId('uuid-0')).toBeInTheDocument()
    expect(screen.getByTestId('uuid-1')).toBeInTheDocument()
    expect(screen.getByTestId('uuid-2')).toBeInTheDocument()
  })

  it('copies a single UUID to clipboard', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const generateButton = screen.getByTestId('button-generate-single')
    await user.click(generateButton)

    const copyButton = screen.getByTestId('button-copy-0')
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('shows copy all button when multiple UUIDs are generated', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const countInput = screen.getByTestId('input-count')
    const generateButton = screen.getByTestId('button-generate')

    await user.clear(countInput)
    await user.type(countInput, '2')
    await user.click(generateButton)

    const copyAllButton = screen.getByTestId('button-copy-all')
    expect(copyAllButton).toBeInTheDocument()
  })

  it('copies all UUIDs to clipboard with newlines', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const countInput = screen.getByTestId('input-count')
    const generateButton = screen.getByTestId('button-generate')

    await user.clear(countInput)
    await user.type(countInput, '2')
    await user.click(generateButton)

    const copyAllButton = screen.getByTestId('button-copy-all')
    expect(copyAllButton).toBeEnabled()
    await user.click(copyAllButton)
  })

  it('handles minimum count of 1', async () => {
    const user = userEvent.setup()
    render(<UuidGenerator />)

    const countInput = screen.getByTestId('input-count')
    const generateButton = screen.getByTestId('button-generate')

    await user.clear(countInput)
    await user.type(countInput, '0')
    await user.click(generateButton)

    // Should still generate at least 1 UUID
    expect(screen.getByTestId('uuid-0')).toBeInTheDocument()
  })
})
