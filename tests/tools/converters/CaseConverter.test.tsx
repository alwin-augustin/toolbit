import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CaseConverter from '@/components/tools/CaseConverter'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('CaseConverter', () => {
  it('renders the component with correct title', () => {
    render(<CaseConverter />)
    expect(screen.getByText('Case Converter')).toBeInTheDocument()
  })

  it('converts to uppercase', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const upperOutput = screen.getByTestId('output-upper')

    await user.type(input, 'hello world')
    await user.click(convertButton)

    expect(upperOutput).toHaveValue('HELLO WORLD')
  })

  it('converts to lowercase', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const lowerOutput = screen.getByTestId('output-lower')

    await user.type(input, 'HELLO WORLD')
    await user.click(convertButton)

    expect(lowerOutput).toHaveValue('hello world')
  })

  it('converts to title case', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const titleOutput = screen.getByTestId('output-title')

    await user.type(input, 'hello world example')
    await user.click(convertButton)

    expect(titleOutput).toHaveValue('Hello World Example')
  })

  it('converts to camelCase', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const camelOutput = screen.getByTestId('output-camel')

    await user.type(input, 'hello world example')
    await user.click(convertButton)

    expect(camelOutput).toHaveValue('helloWorldExample')
  })

  it('converts to PascalCase', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const pascalOutput = screen.getByTestId('output-pascal')

    await user.type(input, 'hello world example')
    await user.click(convertButton)

    expect(pascalOutput).toHaveValue('HelloWorldExample')
  })

  it('converts to snake_case', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const snakeOutput = screen.getByTestId('output-snake')

    await user.type(input, 'hello world example')
    await user.click(convertButton)

    expect(snakeOutput).toHaveValue('hello_world_example')
  })

  it('converts to kebab-case', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const kebabOutput = screen.getByTestId('output-kebab')

    await user.type(input, 'hello world example')
    await user.click(convertButton)

    expect(kebabOutput).toHaveValue('hello-world-example')
  })

  it('converts to CONSTANT_CASE', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')
    const constantOutput = screen.getByTestId('output-constant')

    await user.type(input, 'hello world example')
    await user.click(convertButton)

    expect(constantOutput).toHaveValue('HELLO_WORLD_EXAMPLE')
  })

  it('copies converted text to clipboard', async () => {
    const user = userEvent.setup()
    render(<CaseConverter />)

    const input = screen.getByTestId('input-case')
    const convertButton = screen.getByTestId('button-convert')

    await user.type(input, 'hello world')
    await user.click(convertButton)

    const copyButton = screen.getByTestId('button-copy-upper')
    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('disables copy buttons when output is empty', () => {
    render(<CaseConverter />)

    const copyButton = screen.getByTestId('button-copy-upper')
    expect(copyButton).toBeDisabled()
  })
})
