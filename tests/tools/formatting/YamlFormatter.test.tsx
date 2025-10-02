import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YamlFormatter from '@/components/tools/YamlFormatter'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('YamlFormatter', () => {
  it('renders the component with correct title', () => {
    render(<YamlFormatter />)
    expect(screen.getByText('YAML Formatter & Converter')).toBeInTheDocument()
  })

  it('formats YAML', async () => {
    const user = userEvent.setup()
    render(<YamlFormatter />)

    const input = screen.getByTestId('input-yaml')
    const formatButton = screen.getByTestId('button-format-yaml')
    const output = screen.getByTestId('output-yaml')

    await user.type(input, 'name: John\nage: 30')
    await user.click(formatButton)

    expect(output.value).toContain('name: John')
    expect(output.value).toContain('age: 30')
  })

  it('converts YAML to JSON', async () => {
    const user = userEvent.setup()
    render(<YamlFormatter />)

    const input = screen.getByTestId('input-yaml')
    const yamlToJsonButton = screen.getByTestId('button-yaml-to-json')
    const output = screen.getByTestId('output-yaml')

    await user.type(input, 'name: John\nage: 30')
    await user.click(yamlToJsonButton)

    expect(output.value).toContain('"name": "John"')
    expect(output.value).toContain('"age": 30')
  })

  it('converts JSON to YAML', async () => {
    const user = userEvent.setup()
    render(<YamlFormatter />)

    const input = screen.getByTestId('input-yaml')
    const jsonToYamlButton = screen.getByTestId('button-json-to-yaml')
    const output = screen.getByTestId('output-yaml')

    await user.click(input)
    await user.paste('{"name":"John","age":30}')
    await user.click(jsonToYamlButton)

    expect(output.value).toContain('name: John')
    expect(output.value).toContain('age: 30')
  })

  it('handles invalid YAML gracefully', async () => {
    const user = userEvent.setup()
    render(<YamlFormatter />)

    const input = screen.getByTestId('input-yaml')
    const formatButton = screen.getByTestId('button-format-yaml')
    const output = screen.getByTestId('output-yaml')

    await user.type(input, 'invalid:\n  - yaml\n wrong indent')
    await user.click(formatButton)

    expect(output.value).toContain('Error')
  })

  it('handles invalid JSON to YAML conversion', async () => {
    const user = userEvent.setup()
    render(<YamlFormatter />)

    const input = screen.getByTestId('input-yaml')
    const jsonToYamlButton = screen.getByTestId('button-json-to-yaml')
    const output = screen.getByTestId('output-yaml')

    await user.click(input)
    await user.paste('{invalid json}')
    await user.click(jsonToYamlButton)

    expect(output.value).toContain('Error')
  })

  it('copies output to clipboard', async () => {
    const user = userEvent.setup()
    render(<YamlFormatter />)

    const input = screen.getByTestId('input-yaml')
    const formatButton = screen.getByTestId('button-format-yaml')
    const copyButton = screen.getByTestId('button-copy')

    await user.type(input, 'test: value')
    await user.click(formatButton)

    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('disables copy button when output is empty', () => {
    render(<YamlFormatter />)

    const copyButton = screen.getByTestId('button-copy')
    expect(copyButton).toBeDisabled()
  })
})
