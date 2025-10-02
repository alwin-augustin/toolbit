import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColorConverter from '@/components/tools/ColorConverter'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('ColorConverter', () => {
  it('renders the component with correct title', () => {
    render(<ColorConverter />)
    expect(screen.getByText('Color Converter & Picker')).toBeInTheDocument()
  })

  it('displays color preview', () => {
    render(<ColorConverter />)
    const preview = screen.getByTestId('color-preview')
    expect(preview).toBeInTheDocument()
  })

  it('updates RGB when HEX changes', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const hexInput = screen.getByTestId('input-hex')
    const rgbOutput = screen.getByTestId('output-rgb')

    await user.clear(hexInput)
    await user.type(hexInput, '#ff0000')

    expect(rgbOutput).toHaveValue('rgb(255, 0, 0)')
  })

  it('updates HEX when RGB changes', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const rInput = screen.getByTestId('input-r')
    const gInput = screen.getByTestId('input-g')
    const bInput = screen.getByTestId('input-b')
    const hexInput = screen.getByTestId('input-hex')

    await user.clear(rInput)
    await user.type(rInput, '0')
    await user.clear(gInput)
    await user.type(gInput, '255')
    await user.clear(bInput)
    await user.type(bInput, '0')

    expect(hexInput).toHaveValue('#00ff00')
  })

  it('converts RGB to HSL', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const hexInput = screen.getByTestId('input-hex')
    const hslOutput = screen.getByTestId('output-hsl')

    await user.clear(hexInput)
    await user.type(hexInput, '#0000ff')

    expect(hslOutput.value).toContain('240')
  })

  it('converts HSL to RGB', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const hInput = screen.getByTestId('input-h')
    const sInput = screen.getByTestId('input-s')
    const lInput = screen.getByTestId('input-l')
    const rgbOutput = screen.getByTestId('output-rgb')

    await user.clear(hInput)
    await user.type(hInput, '0')
    await user.clear(sInput)
    await user.type(sInput, '100')
    await user.clear(lInput)
    await user.type(lInput, '50')

    expect(rgbOutput).toHaveValue('rgb(255, 0, 0)')
  })

  it('copies HEX value to clipboard', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const copyHexButton = screen.getByTestId('button-copy-hex')
    expect(copyHexButton).toBeEnabled()
    await user.click(copyHexButton)
  })

  it('copies RGB value to clipboard', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const copyRgbButton = screen.getByTestId('button-copy-rgb')
    expect(copyRgbButton).toBeEnabled()
    await user.click(copyRgbButton)
  })

  it('copies HSL value to clipboard', async () => {
    const user = userEvent.setup()
    render(<ColorConverter />)

    const copyHslButton = screen.getByTestId('button-copy-hsl')
    expect(copyHslButton).toBeEnabled()
    await user.click(copyHslButton)
  })
})
