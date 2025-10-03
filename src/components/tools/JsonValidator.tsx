import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Shield, CheckCircle, XCircle } from "lucide-react"
import Ajv from "ajv"
import { ToolCard } from "@/components/ToolCard"

export default function JsonValidator() {
    const [jsonData, setJsonData] = useState("")
    const [schema, setSchema] = useState("")
    const [result, setResult] = useState("")
    const [isValid, setIsValid] = useState(true)

    const validateJson = () => {
        try {
            const parsedData = JSON.parse(jsonData)
            const parsedSchema = JSON.parse(schema)

            const ajv = new Ajv()
            const validate = ajv.compile(parsedSchema)
            const valid = validate(parsedData)

            if (valid) {
                setResult("✅ JSON is valid according to the schema")
                setIsValid(true)
            } else {
                const errors = validate.errors?.map(err =>
                    `${err.instancePath || 'root'}: ${err.message}`
                ).join('\n') || 'Unknown validation error'
                setResult(`❌ Validation failed:\n${errors}`)
                setIsValid(false)
            }
        } catch (error) {
            setResult(`Error: ${error instanceof Error ? error.message : 'Invalid JSON or schema'}`)
            setIsValid(false)
        }
    }

    return (
        <ToolCard
            title="JSON Schema Validator"
            description="Validate JSON data against a JSON schema"
            icon={<Shield className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="json-data" className="text-sm font-medium">
                        JSON Data
                    </label>
                    <Textarea
                        id="json-data"
                        placeholder='{"name": "John", "age": 30}'
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        className="h-32 font-mono text-sm"
                        data-testid="input-json-data"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="json-schema" className="text-sm font-medium">
                        JSON Schema
                    </label>
                    <Textarea
                        id="json-schema"
                        placeholder='{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "number"}}, "required": ["name", "age"]}'
                        value={schema}
                        onChange={(e) => setSchema(e.target.value)}
                        className="h-32 font-mono text-sm"
                        data-testid="input-json-schema"
                    />
                </div>
            </div>

            <Button onClick={validateJson} className="w-full" data-testid="button-validate">
                <Shield className="h-4 w-4 mr-2" />
                Validate
            </Button>

            {result && (
                <div className={`p-4 rounded-md border ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'}`}>
                    <div className="flex items-start gap-2">
                        {isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        )}
                        <pre className="text-sm whitespace-pre-wrap font-mono" data-testid="validation-result">
                            {result}
                        </pre>
                    </div>
                </div>
            )}
        </ToolCard>
    )
}