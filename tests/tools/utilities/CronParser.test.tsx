import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CronParser from '@/components/tools/CronParser'

describe('CronParser', () => {
  it('renders the component with correct title', () => {
    render(<CronParser />)
    expect(screen.getByText('Cron Expression Parser')).toBeInTheDocument()
  })

  it('has default cron expression', () => {
    render(<CronParser />)
    const input = screen.getByTestId('cron-input') as HTMLInputElement
    expect(input.value).toBe('* * * * *')
  })

  it('parses cron expression and shows next dates', async () => {
    const user = userEvent.setup()
    render(<CronParser />)

    const parseButton = screen.getByTestId('parse-button')
    await user.click(parseButton)

    const output = screen.getByTestId('cron-output') as HTMLTextAreaElement
    expect(output.value).toContain('Next 5 dates:')
  })

  it('handles custom cron expression', async () => {
    const user = userEvent.setup()
    render(<CronParser />)

    const input = screen.getByTestId('cron-input')
    const parseButton = screen.getByTestId('parse-button')

    await user.clear(input)
    await user.type(input, '0 12 * * *')
    await user.click(parseButton)

    const output = screen.getByTestId('cron-output') as HTMLTextAreaElement
    expect(output.value).toContain('Next 5 dates:')
  })

  it('handles invalid cron expression', async () => {
    const user = userEvent.setup()
    render(<CronParser />)

    const input = screen.getByTestId('cron-input')
    const parseButton = screen.getByTestId('parse-button')

    await user.clear(input)
    await user.type(input, 'invalid cron')
    await user.click(parseButton)

    const output = screen.getByTestId('cron-output') as HTMLTextAreaElement
    expect(output.value).toContain('Error')
  })

  it('parses every minute cron expression', async () => {
    const user = userEvent.setup()
    render(<CronParser />)

    const input = screen.getByTestId('cron-input')
    const parseButton = screen.getByTestId('parse-button')

    await user.clear(input)
    await user.type(input, '* * * * *')
    await user.click(parseButton)

    const output = screen.getByTestId('cron-output') as HTMLTextAreaElement
    expect(output.value).toContain('Next 5 dates:')
  })

  it('parses daily cron expression', async () => {
    const user = userEvent.setup()
    render(<CronParser />)

    const input = screen.getByTestId('cron-input')
    const parseButton = screen.getByTestId('parse-button')

    await user.clear(input)
    await user.type(input, '0 0 * * *')
    await user.click(parseButton)

    const output = screen.getByTestId('cron-output') as HTMLTextAreaElement
    expect(output.value).toContain('Next 5 dates:')
  })
})
