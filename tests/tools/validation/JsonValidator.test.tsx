import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JsonValidator from '@/components/tools/JsonValidator'

describe('JsonValidator', () => {
  it('renders the component with correct title', () => {
    render(<JsonValidator />)
    expect(screen.getByText('JSON Schema Validator')).toBeInTheDocument()
  })

  it('validates JSON against a schema successfully', async () => {
    const user = userEvent.setup()
    render(<JsonValidator />)

    const jsonData = screen.getByTestId('input-json-data')
    const jsonSchema = screen.getByTestId('input-json-schema')
    const validateButton = screen.getByTestId('button-validate')

    await user.click(jsonData)
    await user.paste('{"name":"John","age":30}')
    await user.click(jsonSchema)
    await user.paste('{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}')
    await user.click(validateButton)

    const result = screen.getByTestId('validation-result')
    expect(result).toHaveTextContent(/valid according to the schema/i)
  })

  it('shows validation errors for invalid data', async () => {
    const user = userEvent.setup()
    render(<JsonValidator />)

    const jsonData = screen.getByTestId('input-json-data')
    const jsonSchema = screen.getByTestId('input-json-schema')
    const validateButton = screen.getByTestId('button-validate')

    await user.click(jsonData)
    await user.paste('{"name":123}')
    await user.click(jsonSchema)
    await user.paste('{"type":"object","properties":{"name":{"type":"string"}}}')
    await user.click(validateButton)

    const result = screen.getByTestId('validation-result')
    expect(result).toHaveTextContent(/validation failed/i)
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<JsonValidator />)

    const jsonData = screen.getByTestId('input-json-data')
    const jsonSchema = screen.getByTestId('input-json-schema')
    const validateButton = screen.getByTestId('button-validate')

    await user.click(jsonData)
    await user.paste('{}')
    await user.click(jsonSchema)
    await user.paste('{"type":"object","required":["name"]}')
    await user.click(validateButton)

    const result = screen.getByTestId('validation-result')
    expect(result).toHaveTextContent(/validation failed/i)
  })

  it('handles invalid JSON data gracefully', async () => {
    const user = userEvent.setup()
    render(<JsonValidator />)

    const jsonData = screen.getByTestId('input-json-data')
    const jsonSchema = screen.getByTestId('input-json-schema')
    const validateButton = screen.getByTestId('button-validate')

    await user.type(jsonData, 'invalid json')
    await user.click(jsonSchema)
    await user.paste('{"type":"object"}')
    await user.click(validateButton)

    const result = screen.getByTestId('validation-result')
    expect(result).toHaveTextContent(/error/i)
  })

  it('handles invalid schema gracefully', async () => {
    const user = userEvent.setup()
    render(<JsonValidator />)

    const jsonData = screen.getByTestId('input-json-data')
    const jsonSchema = screen.getByTestId('input-json-schema')
    const validateButton = screen.getByTestId('button-validate')

    await user.click(jsonData)
    await user.paste('{"test":"value"}')
    await user.type(jsonSchema, 'invalid schema')
    await user.click(validateButton)

    const result = screen.getByTestId('validation-result')
    expect(result).toHaveTextContent(/error/i)
  })

  it('validates complex nested schemas', async () => {
    const user = userEvent.setup()
    render(<JsonValidator />)

    const jsonData = screen.getByTestId('input-json-data')
    const jsonSchema = screen.getByTestId('input-json-schema')
    const validateButton = screen.getByTestId('button-validate')

    await user.click(jsonData)
    await user.paste('{"user":{"name":"John","address":{"city":"NYC"}}}')
    await user.click(jsonSchema)
    await user.paste('{"type":"object","properties":{"user":{"type":"object","properties":{"name":{"type":"string"}}}}}')
    await user.click(validateButton)

    const result = screen.getByTestId('validation-result')
    expect(result).toHaveTextContent(/valid according to the schema/i)
  })
})
