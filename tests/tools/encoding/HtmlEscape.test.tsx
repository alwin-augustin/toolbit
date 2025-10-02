import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HtmlEscape from '@/components/tools/HtmlEscape'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('HtmlEscape', () => {
  it('renders the component with correct title', () => {
    render(<HtmlEscape />)
    expect(screen.getByText('HTML Escape / Unescape')).toBeInTheDocument()
  })

  it('escapes HTML entities', async () => {
    const user = userEvent.setup()
    render(<HtmlEscape />)

    const input = screen.getByTestId('input-html')
    const escapeButton = screen.getByTestId('button-escape')
    const output = screen.getByTestId('output-html')

    await user.type(input, '<div>Hello & World</div>')
    await user.click(escapeButton)

    expect(output).toHaveValue('&lt;div&gt;Hello &amp; World&lt;/div&gt;')
  })

  it('unescapes HTML entities', async () => {
    const user = userEvent.setup()
    render(<HtmlEscape />)

    const input = screen.getByTestId('input-html')
    const unescapeButton = screen.getByTestId('button-unescape')
    const output = screen.getByTestId('output-html')

    await user.type(input, '&lt;div&gt;Hello &amp; World&lt;/div&gt;')
    await user.click(unescapeButton)

    expect(output).toHaveValue('<div>Hello & World</div>')
  })

  it('escapes quotes correctly', async () => {
    const user = userEvent.setup()
    render(<HtmlEscape />)

    const input = screen.getByTestId('input-html')
    const escapeButton = screen.getByTestId('button-escape')
    const output = screen.getByTestId('output-html')

    await user.type(input, `"double" and 'single' quotes`)
    await user.click(escapeButton)

    expect(output).toHaveValue('&quot;double&quot; and &#39;single&#39; quotes')
  })

  it('loads sample text', async () => {
    const user = userEvent.setup()
    render(<HtmlEscape />)

    const input = screen.getByTestId('input-html')
    const sampleButton = screen.getByTestId('button-sample')

    await user.click(sampleButton)

    expect(input).toHaveValue('<div class="example">Hello & "welcome" to <HTML> escape tool!</div>')
  })

  it('escapes sample text correctly', async () => {
    const user = userEvent.setup()
    render(<HtmlEscape />)

    const sampleButton = screen.getByTestId('button-sample')
    const escapeButton = screen.getByTestId('button-escape')
    const output = screen.getByTestId('output-html')

    await user.click(sampleButton)
    await user.click(escapeButton)

    expect(output).toHaveValue('&lt;div class=&quot;example&quot;&gt;Hello &amp; &quot;welcome&quot; to &lt;HTML&gt; escape tool!&lt;/div&gt;')
  })

  it('copies output to clipboard', async () => {
    const user = userEvent.setup()
    render(<HtmlEscape />)

    const input = screen.getByTestId('input-html')
    const escapeButton = screen.getByTestId('button-escape')
    const copyButton = screen.getByTestId('button-copy')

    await user.type(input, '<test>')
    await user.click(escapeButton)

    expect(copyButton).toBeEnabled()
    await user.click(copyButton)
  })

  it('disables copy button when output is empty', () => {
    render(<HtmlEscape />)

    const copyButton = screen.getByTestId('button-copy')
    expect(copyButton).toBeDisabled()
  })
})
