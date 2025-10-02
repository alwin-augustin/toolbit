import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimestampConverter from '@/components/tools/TimestampConverter'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('TimestampConverter', () => {
  it('renders the component with correct title', () => {
    render(<TimestampConverter />)
    expect(screen.getByText('Timestamp Converter')).toBeInTheDocument()
  })

  it('converts Unix timestamp to date formats', async () => {
    const user = userEvent.setup()
    render(<TimestampConverter />)

    const timestampInput = screen.getByTestId('input-timestamp')
    const convertButton = screen.getByTestId('button-convert-timestamp')

    await user.type(timestampInput, '1640995200')
    await user.click(convertButton)

    expect(screen.getByTestId('output-unix')).toHaveValue('1640995200')
    expect(screen.getByTestId('output-iso')).toBeInTheDocument()
    expect(screen.getByTestId('output-local')).toBeInTheDocument()
    expect(screen.getByTestId('output-utc')).toBeInTheDocument()
  })

  it('converts datetime to Unix timestamp', async () => {
    const user = userEvent.setup()
    render(<TimestampConverter />)

    const datetimeInput = screen.getByTestId('input-datetime')
    const convertButton = screen.getByTestId('button-convert-datetime')

    await user.type(datetimeInput, '2022-01-01T00:00')
    await user.click(convertButton)

    expect(screen.getByTestId('output-unix')).toBeInTheDocument()
  })

  it('gets current timestamp', async () => {
    const user = userEvent.setup()
    render(<TimestampConverter />)

    const currentButton = screen.getByTestId('button-current')
    await user.click(currentButton)

    expect(screen.getByTestId('output-unix')).toBeInTheDocument()
    expect(screen.getByTestId('output-iso')).toBeInTheDocument()
    expect(screen.getByTestId('output-relative')).toHaveValue('Now')
  })

  it('displays all output formats', async () => {
    const user = userEvent.setup()
    render(<TimestampConverter />)

    const timestampInput = screen.getByTestId('input-timestamp')
    const convertButton = screen.getByTestId('button-convert-timestamp')

    await user.type(timestampInput, '1640995200')
    await user.click(convertButton)

    expect(screen.getByText('Unix Timestamp:')).toBeInTheDocument()
    expect(screen.getByText('ISO 8601:')).toBeInTheDocument()
    expect(screen.getByText('Local Time:')).toBeInTheDocument()
    expect(screen.getByText('UTC:')).toBeInTheDocument()
    expect(screen.getByText('Relative:')).toBeInTheDocument()
  })

  it('copies Unix timestamp to clipboard', async () => {
    const user = userEvent.setup()
    render(<TimestampConverter />)

    const timestampInput = screen.getByTestId('input-timestamp')
    const convertButton = screen.getByTestId('button-convert-timestamp')

    await user.type(timestampInput, '1640995200')
    await user.click(convertButton)

    const copyButton = screen.getByTestId('button-copy-unix')
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('copies ISO format to clipboard', async () => {
    const user = userEvent.setup()
    render(<TimestampConverter />)

    const timestampInput = screen.getByTestId('input-timestamp')
    const convertButton = screen.getByTestId('button-convert-timestamp')

    await user.type(timestampInput, '1640995200')
    await user.click(convertButton)

    const copyButton = screen.getByTestId('button-copy-iso')
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })
})
